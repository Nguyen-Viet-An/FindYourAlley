'use server'

import { revalidatePath } from 'next/cache'
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import Festival from '@/lib/database/models/festival.model';
import { handleError, normalizeTags } from '@/lib/utils'
import mongoose from 'mongoose';

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}

const getCategoriesByNames = async (names: string | string[]) => {
  const nameArray = Array.isArray(names) ? names : [names]; // Ensure names is an array
  const categories = await Category.find({ name: { $in: nameArray.map(name => new RegExp(`^${name}$`, 'i')) } });
  return categories;
};

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    .populate({ path: 'festival', model: Festival, select: '_id name code' })
    .populate({ path: 'images.category', model: Category, select: '_id name type' }); // Populate categories inside images
};

export const convertToObjectIdArray = async (stringIds: string[]): Promise<mongoose.Types.ObjectId[]> => {
  return stringIds.map(id => new mongoose.Types.ObjectId(id));
}

// CREATE
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    await connectToDatabase();

    const {
      title,
      description,
      artists,    // new field from schema
      images,
      startDateTime,
      endDateTime,
      hasPreorder,
      extraTag,
      url,
      festival,
    } = event;

    const formattedImages = await Promise.all(
      images.map(async (img) => {
        const categoryIds = Array.isArray(img.category) ? img.category :
                            img.category ? [img.category] : [];
        return {
          imageUrl: img.imageUrl,
          category: await convertToObjectIdArray(categoryIds),
        };
      })
    );

    // multi festivals
    let festivalIds: mongoose.Types.ObjectId[] = [];
    if (festival && festival.length) {
      festivalIds = festival.reduce((acc: mongoose.Types.ObjectId[], fid: string) => {
        try { acc.push(new mongoose.Types.ObjectId(fid)); } catch {}
        return acc;
      }, []);
    }

    const eventData: any = {
      title,
      description,
      artists: artists || [], // add artists array
      images: formattedImages,
      startDateTime,
      endDateTime,
      extraTag: normalizeTags(event.extraTag),
      url,
      hasPreorder: hasPreorder || "No",
      organizer: userId,
    };

    if (festivalIds.length) eventData.festival = festivalIds;

    const newEvent = await Event.create(eventData);

    revalidatePath(path);
    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase();

    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error("Unauthorized or event not found");
    }

    const formattedImages = await Promise.all(
      event.images.map(async (img) => ({
        imageUrl: img.imageUrl,
        category: Array.isArray(img.category) && img.category.length > 0
          ? await convertToObjectIdArray(img.category)
          : [],
      }))
    );

    let festivalIds: mongoose.Types.ObjectId[] = [];
    if (event.festival && event.festival.length) {
      festivalIds = event.festival.reduce((acc: mongoose.Types.ObjectId[], fid: string) => {
        try { acc.push(new mongoose.Types.ObjectId(fid)); } catch {}
        return acc;
      }, []);
    }

    const updatePayload: any = {
      title: event.title,
      description: event.description,
      artists: event.artists || [], // update artists array
      images: formattedImages,
      startDateTime: event.startDateTime,
      endDateTime: event.endDateTime,
      hasPreorder: event.hasPreorder || "No",
      extraTag: normalizeTags(event.extraTag), // normalize on update
      url: event.url,
    };

    if (festivalIds.length) updatePayload.festival = festivalIds; else updatePayload.festival = [];

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { $set: updatePayload },
      { new: true }
    );

    revalidatePath(path);
    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}

// GET ONE EVENT BY ID
export async function getEventById(eventId: string) {
  try {
    await connectToDatabase()

    const event = await populateEvent(Event.findById(eventId))

    if (!event) throw new Error('Event not found')

    return JSON.parse(JSON.stringify(event))
  } catch (error) {
    handleError(error)
  }
}


// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase()

    const deletedEvent = await Event.findByIdAndDelete(eventId)

    if (deletedEvent) {
      const keys = deletedEvent.images.map((img: any) => {
        // imageUrl looks like https://r2-worker.yourdomain.workers.dev/uploads/uuid-filename.jpg
        // we only need the path inside the bucket (after the domain)
        const url = new URL(img.imageUrl);
        return { Key: url.pathname.replace(/^\/+/, "") }; // e.g. "uploads/uuid-file.jpg"
      });

      if (keys.length > 0) {
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Delete: { Objects: keys },
          })
        );
      }

      revalidatePath(path)
    }
  } catch (error) {
    handleError(error)
  }
}

// GET ALL EVENTS
export async function getAllEvents({ query, limit = 6, page, fandom, itemType, hasPreorder, festivalId }: GetAllEventsParams) {
  try {
    await connectToDatabase();

    const pageNumber = Number(page) || 1;
    const imagesPerPage = Number(limit) || 6;

    // 1. Build base query (event-level) excluding category specifics first
    const baseQuery: any = {};

    if (query) {
      baseQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { extraTag: { $regex: query, $options: 'i' } },
        { 'artists.name': { $regex: query, $options: 'i' } }
      ];
    }

    if (hasPreorder) {
      baseQuery.hasPreorder = hasPreorder; // "Yes" | "No"
    }

    if (festivalId) {
      if (Array.isArray(festivalId)) {
        baseQuery.festival = { $in: festivalId.map(id => { try { return new mongoose.Types.ObjectId(id); } catch { return null } }).filter(Boolean) };
      } else {
        baseQuery.festival = { $in: [new mongoose.Types.ObjectId(festivalId)] };
      }
    }

    // Category filter handling
    const hasCategoryFilter = (fandom && fandom.length > 0) || (itemType && itemType.length > 0);
    let requestedCategoryIds: string[] = [];
    let categoryIds: mongoose.Types.ObjectId[] = [];

    if (hasCategoryFilter) {
      const categories = await getCategoriesByNames([...(fandom || []), ...(itemType || [])]);
      if (categories.length) {
        categoryIds = categories.map((c: any) => new mongoose.Types.ObjectId(c._id));
        requestedCategoryIds = categories.map((c: any) => c._id.toString());
        // Event must have at least one image including ALL selected categories to be considered
        baseQuery['images.category'] = { $all: categoryIds };
      } else {
        // No matching categories -> return empty result early
        return { data: [], totalPages: 1, requestedCategoryIds: [] };
      }
    }

    // Helper to determine how many events to fetch to satisfy images up to current page
    const determineEventIdsForPage = (counts: Array<{ _id: any; imgCount: number }>, neededImages: number) => {
      let cumulative = 0;
      let lastIdx = counts.length - 1; // fallback all
      for (let i = 0; i < counts.length; i++) {
        cumulative += counts[i].imgCount;
        if (cumulative >= neededImages) { lastIdx = i; break; }
      }
      return counts.slice(0, lastIdx + 1).map(c => c._id);
    };

    // CATEGORY FILTER PATH (paginate by matching images only)
    if (hasCategoryFilter && categoryIds.length > 0) {
      // Aggregate per-event matching image counts (respecting createdAt sort desc)
      const matchingCounts = await Event.aggregate([
        { $match: baseQuery },
        {
          $project: {
            createdAt: 1,
            matchingImages: {
              $filter: {
                input: '$images',
                as: 'img',
                cond: { $setIsSubset: [categoryIds, '$$img.category'] } // image must contain ALL selected categories
              }
            }
          }
        },
        { $addFields: { imgCount: { $size: '$matchingImages' } } },
        { $match: { imgCount: { $gt: 0 } } },
        { $sort: { createdAt: -1 } },
        { $project: { imgCount: 1 } }
      ]);

      const totalMatchingImages = matchingCounts.reduce((sum: number, d: any) => sum + (d.imgCount || 0), 0);
      const totalPages = Math.max(1, Math.ceil(totalMatchingImages / imagesPerPage));

      // Determine required events to cover pages up to current page
      const neededImages = pageNumber * imagesPerPage;
      const eventIdsToFetch = determineEventIdsForPage(matchingCounts, neededImages);

      const events = await populateEvent(
        Event.find({ _id: { $in: eventIdsToFetch } }).sort({ createdAt: -1 })
      );

      return {
        data: JSON.parse(JSON.stringify(events)),
        totalPages,
        requestedCategoryIds
      };
    }

    // NO CATEGORY FILTER: paginate across ALL images of matching events
    // Aggregate counts of images per event (sorted desc by createdAt)
    const counts = await Event.aggregate([
      { $match: baseQuery },
      { $project: { createdAt: 1, imgCount: { $size: '$images' } } },
      { $sort: { createdAt: -1 } }
    ]);

    const totalImages = counts.reduce((sum: number, d: any) => sum + (d.imgCount || 0), 0);
    const totalPages = Math.max(1, Math.ceil(totalImages / imagesPerPage));

    const neededImages = pageNumber * imagesPerPage;
    const eventIdsToFetch = determineEventIdsForPage(counts, neededImages);

    const events = await populateEvent(
      Event.find({ _id: { $in: eventIdsToFetch } }).sort({ createdAt: -1 })
    );

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages,
      requestedCategoryIds
    };
  } catch (error) {
    handleError(error);
  }
}

// GET EVENTS BY ORGANIZER
export async function getEventsByUser({ userId, limit = 6, page }: GetEventsByUserParams) {
  try {
    await connectToDatabase()

    const conditions = { organizer: userId }
    const skipAmount = (page - 1) * limit

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    return { data: JSON.parse(JSON.stringify(events)), totalPages: Math.ceil(eventsCount / limit) }
  } catch (error) {
    handleError(error)
  }
}

export async function getUniqueEventTitleCount() {
  await connectToDatabase();
  const events = await Event.find({}, 'title').lean();

  const codeRegex = /([A-Z]+\d+)/i;

  const uniqueCodes = new Set(
    events.map((event) => {
      const match = event.title.match(codeRegex);
      return match ? match[1].toUpperCase() : null;
    }).filter(Boolean)
  );

  return uniqueCodes.size;
}

export async function getPopularFandoms(limit = 5) {
  await connectToDatabase();

  const results = await Event.aggregate([
    { $unwind: "$images" },
    { $unwind: "$images.category" },
    {
      $lookup: {
        from: "categories",
        localField: "images.category",
        foreignField: "_id",
        as: "categoryDoc"
      }
    },
    { $unwind: "$categoryDoc" },
    { $match: { "categoryDoc.type": "fandom" } },
    {
      $group: {
        _id: "$categoryDoc.name",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return results.map((r: any) => ({ name: r._id, value: r.count }));
}

export async function getPopularItemTypes(limit = 5) {
  await connectToDatabase();

  const results = await Event.aggregate([
    { $unwind: "$images" },
    { $unwind: "$images.category" },
    {
      $lookup: {
        from: "categories",
        localField: "images.category",
        foreignField: "_id",
        as: "categoryDoc"
      }
    },
    { $unwind: "$categoryDoc" },
    { $match: { "categoryDoc.type": "itemType" } },
    {
      $group: {
        _id: "$categoryDoc.name",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return results.map((r: any) => ({ name: r._id, value: r.count }));
}

export async function getAllExtraTags() {
  await connectToDatabase();
  const tags = await Event.distinct("extraTag"); // get raw values
  const normalized = Array.from(new Set(tags.filter(Boolean).map((t: string) => t.trim().toLowerCase())));
  (normalized as string[]).sort((a: string, b: string) => a.localeCompare(b, 'en'));
  return normalized;
}

export async function getEventsByTag(tag: string) {
  await connectToDatabase();
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapeRegExp(tag)}$`, 'i');
  const events = await Event.find({ extraTag: regex }).populate("organizer").lean();
  return JSON.parse(JSON.stringify(events));
}

export async function getPopularExtraTags(limit = 10) {
  await connectToDatabase();

  const results = await Event.aggregate([
    { $unwind: "$extraTag" }, // Make sure extraTag is stored as an array
    { $match: { extraTag: { $ne: null } } },
    { $group: { _id: "$extraTag", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);

  return results.map((r: any) => ({ name: r._id, value: r.count }));
}

// RELATED EVENTS (simplified: return up to `limit` events, no pagination)
export async function getRelatedEventsByCategories({
  categoryIds,
  requestedCategoryIds,
  eventId,
  limit = 8,
  festivalId,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase();

    if (!categoryIds || categoryIds.length === 0) {
      return { data: [], totalPages: 1, requestedCategoryIds: [] };
    }

    const normalizedCategoryIds = Array.from(new Set(categoryIds.map(id => id.toString())));
    const categoryObjectIds = normalizedCategoryIds.map(id => new mongoose.Types.ObjectId(id));
    const currentEventObjectId = new mongoose.Types.ObjectId(eventId);

    const match: any = {
      _id: { $ne: currentEventObjectId },
      'images.category': { $in: categoryObjectIds }
    };

    if (festivalId) {
      if (Array.isArray(festivalId)) {
        match.festival = { $in: festivalId.map(id => { try { return new mongoose.Types.ObjectId(id); } catch { return null } }).filter(Boolean) };
      } else {
        try { match.festival = { $in: [new mongoose.Types.ObjectId(festivalId)] }; } catch {}
      }
    }

    const eventsQuery = Event.find(match)
      .sort({ createdAt: -1 })
      .limit(limit);

    const events = await populateEvent(eventsQuery);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: 1,
      requestedCategoryIds: Array.from(new Set(requestedCategoryIds))
    };
  } catch (error) {
    handleError(error);
  }
}
