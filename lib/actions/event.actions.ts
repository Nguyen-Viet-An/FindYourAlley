'use server'

import { revalidatePath } from 'next/cache'
import { unstable_cache } from 'next/cache'
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import Festival from '@/lib/database/models/festival.model';
import { handleError, normalizeTags } from '@/lib/utils'
import mongoose from 'mongoose';
import { Schema } from "mongoose";
import { parseBooth } from '@/lib/utils/booth';

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
  BoothEventMap,
} from '@/types'
import { getSubscribersForCategories } from './notification.actions'
import { sendEmail, buildBatchSampleEmail, canSendEmail } from '@/lib/utils/email'
import NotificationQueue from '@/lib/database/models/notificationQueue.model'

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
    .populate({ path: 'festival', model: Festival, select: '_id name code startDate endDate' })
    .populate({ path: 'images.category', model: Category, select: '_id name type' }); // Populate categories inside images
};

export const convertToObjectIdArray = async (stringIds: string[]): Promise<mongoose.Types.ObjectId[]> => {
  return stringIds.map(id => new mongoose.Types.ObjectId(id));
}

const BATCH_THRESHOLD = 3;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function shouldFlushQueue(queue: any): Promise<boolean> {
  const count = queue.pendingEvents.length;
  if (count === 0) return false;

  const now = new Date();
  const lastSent = queue.lastSentAt ? new Date(queue.lastSentAt).getTime() : 0;
  const daysSinceLastSend = now.getTime() - lastSent;

  // Check if any event starts within 1 day → urgent flush
  const hasUrgent = queue.pendingEvents.some((e: any) => {
    if (!e.eventStartDate) return false;
    const startTime = new Date(e.eventStartDate).getTime();
    return startTime - now.getTime() <= ONE_DAY_MS && startTime > now.getTime();
  });

  if (hasUrgent) return true;

  // Normal threshold: >= 3 events AND at least 1 day since last email
  return count >= BATCH_THRESHOLD && daysSinceLastSend >= ONE_DAY_MS;
}

// Queue notification for a subscriber; send batched email when conditions met
async function notifySubscribers(eventId: mongoose.Types.ObjectId, eventTitle: string) {
  try {
    const populated = await populateEvent(Event.findById(eventId));
    if (!populated) return;

    const categoryNames = populated.images
      .flatMap((img: any) => img.category?.map((c: any) => c.name) || []);

    if (!categoryNames.length) return;

    const eventStartDate = populated.startDateTime || null;
    const subscribers = await getSubscribersForCategories(categoryNames);
    if (!subscribers.length) return;

    for (const sub of subscribers) {
      const matched = [
        ...categoryNames.filter((n: string) => sub.fandoms?.includes(n)),
        ...categoryNames.filter((n: string) => sub.itemTypes?.includes(n)),
      ];
      const unique = [...new Set(matched)] as string[];
      if (!unique.length) continue;

      // Push this event into the user's queue
      const queue = await NotificationQueue.findOneAndUpdate(
        { userId: sub.userId },
        {
          $setOnInsert: { email: sub.email, lastSentAt: null },
          $push: { pendingEvents: {
            eventId: eventId.toString(),
            eventTitle,
            eventStartDate,
            matchedCategories: unique,
          } },
        },
        { upsert: true, new: true }
      );

      // Check if we should flush (send) this queue
      if (await shouldFlushQueue(queue)) {
        if (await canSendEmail()) {
          const { subject, html } = buildBatchSampleEmail(queue.pendingEvents);
          await sendEmail({ to: sub.email, subject, html });
        }
        // Clear queue and record send time
        await NotificationQueue.findOneAndUpdate(
          { userId: sub.userId },
          { $set: { pendingEvents: [], lastSentAt: new Date() } }
        );
      }
    }
  } catch (error) {
    console.error("[Notify] notifySubscribers error:", error);
  }
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
      featuredProduct,
      dealBadge,
      dealDescription,
      attendDays,
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
      attendDays: attendDays || [],
    };

    if (festivalIds.length) eventData.festival = festivalIds;
    if (featuredProduct?.imageUrl && featuredProduct?.description) {
      eventData.featuredProduct = featuredProduct;
    }
    if (dealBadge) eventData.dealBadge = dealBadge;
    if (dealDescription) eventData.dealDescription = dealDescription;

    const newEvent = await Event.create(eventData);

    // Fire email notifications asynchronously (non-blocking)
    notifySubscribers(newEvent._id, title).catch((err) =>
      console.error("[Notify] Error sending notifications:", err)
    );

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
      attendDays: event.attendDays || [],
    };

    if (festivalIds.length) updatePayload.festival = festivalIds; else updatePayload.festival = [];
    if (event.featuredProduct?.imageUrl && event.featuredProduct?.description) {
      updatePayload.featuredProduct = event.featuredProduct;
    } else {
      updatePayload.featuredProduct = undefined;
    }
    updatePayload.dealBadge = event.dealBadge || undefined;
    updatePayload.dealDescription = event.dealDescription || undefined;

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

// GET SEARCH SUGGESTIONS (booth titles, artist names, extra tags)
export const getSearchSuggestions = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      const events = await Event.find({}, 'title artists extraTag').lean();
      const suggestions: { type: string; value: string }[] = [];
      const seen = new Set<string>();

      for (const e of events) {
        const titleKey = `booth:${e.title}`;
        if (!seen.has(titleKey)) { seen.add(titleKey); suggestions.push({ type: 'booth', value: e.title }); }

        if (Array.isArray(e.artists)) {
          for (const a of e.artists) {
            if (a.name) {
              const key = `artist:${a.name.toLowerCase()}`;
              if (!seen.has(key)) { seen.add(key); suggestions.push({ type: 'artist', value: a.name }); }
            }
          }
        }

        if (Array.isArray(e.extraTag)) {
          for (const t of e.extraTag) {
            if (t) {
              const key = `tag:${t.toLowerCase()}`;
              if (!seen.has(key)) { seen.add(key); suggestions.push({ type: 'tag', value: t }); }
            }
          }
        }
      }
      return suggestions;
    } catch (error) {
      handleError(error);
      return [];
    }
  },
  ['search-suggestions'],
  { revalidate: 120 }
);

// GET ALL EVENTS
export async function getAllEvents({ query, limit = 6, page, fandom, itemType, excludeFandom, excludeItemType, hasPreorder, hasDeal, festivalId, sortBy, festivalDay }: GetAllEventsParams) {
  try {
    await connectToDatabase();

    const pageNumber = Number(page) || 1;
    const imagesPerPage = Number(limit) || 6;

    // 1. Build base query (event-level) excluding category specifics first
    const baseQuery: any = {};

    // Day filter: only events that attend the given festival day
    if (festivalDay) {
      baseQuery.attendDays = festivalDay;
    }

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

    // Deal filter: events with dealBadge OR freebie category
    if (hasDeal) {
      const freebieCategories = await Category.find({ name: { $regex: /freebie/i } });
      const freebieCatIds = freebieCategories.map((c: any) => c._id);
      baseQuery.$and = [
        ...(baseQuery.$and || []),
        {
          $or: [
            { dealBadge: { $exists: true, $ne: '' } },
            ...(freebieCatIds.length ? [{ 'images.category': { $in: freebieCatIds } }] : []),
          ],
        },
      ];
    }

    // Blacklist/exclude categories
    if ((excludeFandom && excludeFandom.length > 0) || (excludeItemType && excludeItemType.length > 0)) {
      const excludeNames = [...(excludeFandom || []), ...(excludeItemType || [])];
      const excludeCats = await getCategoriesByNames(excludeNames);
      if (excludeCats.length) {
        const excludeIds = excludeCats.map((c: any) => new mongoose.Types.ObjectId(c._id));
        baseQuery['images.category'] = { ...baseQuery['images.category'], $nin: excludeIds };
      }
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
    let fandomIds: mongoose.Types.ObjectId[] = [];
    let itemTypeIds: mongoose.Types.ObjectId[] = [];

    if (hasCategoryFilter) {
      // Look up fandom and itemType categories separately
      const [fandomCats, itemTypeCats] = await Promise.all([
        fandom && fandom.length > 0 ? getCategoriesByNames(fandom) : Promise.resolve([]),
        itemType && itemType.length > 0 ? getCategoriesByNames(itemType) : Promise.resolve([]),
      ]);
      fandomIds = fandomCats.map((c: any) => new mongoose.Types.ObjectId(c._id));
      itemTypeIds = itemTypeCats.map((c: any) => new mongoose.Types.ObjectId(c._id));
      const allCats = [...fandomCats, ...itemTypeCats];
      if (allCats.length) {
        categoryIds = allCats.map((c: any) => new mongoose.Types.ObjectId(c._id));
        requestedCategoryIds = allCats.map((c: any) => c._id.toString());
        // Event must have at least one image matching ANY of the selected categories (OR logic at event level)
        baseQuery['images.category'] = { ...baseQuery['images.category'], $in: categoryIds };
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
      // Aggregate per-event matching image counts
      const sortStage = sortBy === 'alphabetical' ? { $sort: { title: 1 } as any }
        : sortBy === 'random' ? { $addFields: { _rand: { $rand: {} } } }
        : { $sort: { createdAt: -1 } as any };

      const pipeline: any[] = [
        { $match: baseQuery },
        {
          $project: {
            createdAt: 1,
            title: 1,
            matchingImages: {
              $filter: {
                input: '$images',
                as: 'img',
                cond: (() => {
                  // Build OR-within-group, AND-between-groups condition
                  const conditions: any[] = [];
                  if (fandomIds.length > 0) {
                    // Image must have at least one of the selected fandoms
                    conditions.push({
                      $gt: [{ $size: { $setIntersection: [fandomIds, '$$img.category'] } }, 0]
                    });
                  }
                  if (itemTypeIds.length > 0) {
                    // Image must have at least one of the selected item types
                    conditions.push({
                      $gt: [{ $size: { $setIntersection: [itemTypeIds, '$$img.category'] } }, 0]
                    });
                  }
                  if (conditions.length === 0) return true;
                  if (conditions.length === 1) return conditions[0];
                  return { $and: conditions };
                })()
              }
            }
          }
        },
        { $addFields: { imgCount: { $size: '$matchingImages' } } },
        { $match: { imgCount: { $gt: 0 } } },
      ];

      if (sortBy === 'mostBookmarked') {
        pipeline.push(
          { $lookup: { from: 'orders', localField: '_id', foreignField: 'event', as: '_orders' } },
          { $addFields: { _bookmarkCount: { $size: '$_orders' } } },
          { $sort: { _bookmarkCount: -1 } },
          { $project: { imgCount: 1 } }
        );
      } else if (sortBy === 'random') {
        pipeline.push(
          { $addFields: { _rand: { $rand: {} } } },
          { $sort: { _rand: 1 } },
          { $project: { imgCount: 1 } }
        );
      } else if (sortBy === 'alphabetical') {
        pipeline.push(
          { $sort: { title: 1 } },
          { $project: { imgCount: 1 } }
        );
      } else {
        pipeline.push(
          { $sort: { createdAt: -1 } },
          { $project: { imgCount: 1 } }
        );
      }

      const matchingCounts = await Event.aggregate(pipeline);

      const totalMatchingImages = matchingCounts.reduce((sum: number, d: any) => sum + (d.imgCount || 0), 0);
      const totalPages = Math.max(1, Math.ceil(totalMatchingImages / imagesPerPage));

      const neededImages = pageNumber * imagesPerPage;
      const eventIdsToFetch = determineEventIdsForPage(matchingCounts, neededImages);

      // Preserve the sort order from aggregation
      const idOrder = eventIdsToFetch.map((id: any) => id.toString());
      const eventsUnsorted = await populateEvent(
        Event.find({ _id: { $in: eventIdsToFetch } })
      );
      const eventsArr = JSON.parse(JSON.stringify(eventsUnsorted));
      const events = eventsArr.sort((a: any, b: any) => idOrder.indexOf(a._id) - idOrder.indexOf(b._id));

      return {
        data: events,
        totalPages,
        requestedCategoryIds
      };
    }

    // NO CATEGORY FILTER: paginate across ALL images of matching events
    const noCatPipeline: any[] = [
      { $match: baseQuery },
      { $project: { createdAt: 1, title: 1, imgCount: { $size: '$images' } } },
    ];

    if (sortBy === 'mostBookmarked') {
      noCatPipeline.push(
        { $lookup: { from: 'orders', localField: '_id', foreignField: 'event', as: '_orders' } },
        { $addFields: { _bookmarkCount: { $size: '$_orders' } } },
        { $sort: { _bookmarkCount: -1 } }
      );
    } else if (sortBy === 'random') {
      noCatPipeline.push(
        { $addFields: { _rand: { $rand: {} } } },
        { $sort: { _rand: 1 } }
      );
    } else if (sortBy === 'alphabetical') {
      noCatPipeline.push({ $sort: { title: 1 } });
    } else {
      noCatPipeline.push({ $sort: { createdAt: -1 } });
    }

    const counts = await Event.aggregate(noCatPipeline);

    const totalImages = counts.reduce((sum: number, d: any) => sum + (d.imgCount || 0), 0);
    const totalPages = Math.max(1, Math.ceil(totalImages / imagesPerPage));

    const neededImages = pageNumber * imagesPerPage;
    const eventIdsToFetch = determineEventIdsForPage(counts, neededImages);

    const idOrder = eventIdsToFetch.map((id: any) => id.toString());
    const eventsUnsorted = await populateEvent(
      Event.find({ _id: { $in: eventIdsToFetch } })
    );
    const eventsArr = JSON.parse(JSON.stringify(eventsUnsorted));
    const events = eventsArr.sort((a: any, b: any) => idOrder.indexOf(a._id) - idOrder.indexOf(b._id));

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

export async function getUniqueEventTitleCount(festivalIds?: string[]) {
  await connectToDatabase();
  const filter: any = {};
  if (festivalIds?.length) {
    filter.festival = { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  const events = await Event.find(filter, 'title').lean();

  const uniqueCodes = new Set<string>();

  for (const event of events) {
    const title = event.title || '';

    // 1. Find all alpha+numeric booth codes (e.g., A11, Q22)
    const alphaNumMatches = title.match(/[A-Z]+\d+/gi) || [];
    for (const m of alphaNumMatches) {
      uniqueCodes.add(m.toUpperCase());
    }

    // 2. Handle shorthand "A11-12" → expand to A12 as well
    const shorthandRegex = /([A-Z]+)(\d+)\s*-\s*(\d+)(?=[^A-Za-z\d]|$)/gi;
    let match;
    while ((match = shorthandRegex.exec(title)) !== null) {
      uniqueCodes.add(match[1].toUpperCase() + match[3]);
    }

    // 3. If no alpha codes found in this title, try pure numeric (e.g., "48 - name")
    if (alphaNumMatches.length === 0) {
      const leadingNums = title.match(/^[\d\s,\-]+/);
      if (leadingNums) {
        const parts = leadingNums[0].split(/[,\s\-]+/).filter((p: string) => /^\d+$/.test(p));
        for (const p of parts) {
          uniqueCodes.add(p);
        }
      }
    }
  }

  return uniqueCodes.size;
}

export async function getPopularFandoms(limit = 5, festivalIds?: string[]) {
  await connectToDatabase();

  const pipeline: any[] = [];
  if (festivalIds?.length) {
    pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
  }
  pipeline.push(
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
  );

  const results = await Event.aggregate(pipeline);
  return results.map((r: any) => ({ name: r._id, value: r.count }));
}

export async function getPopularItemTypes(limit = 5, festivalIds?: string[]) {
  await connectToDatabase();

  const pipeline: any[] = [];
  if (festivalIds?.length) {
    pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
  }
  pipeline.push(
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
  );

  const results = await Event.aggregate(pipeline);
  return results.map((r: any) => ({ name: r._id, value: r.count }));
}

export async function getAllExtraTags(festivalIds?: string[]) {
  await connectToDatabase();
  const filter: any = {};
  if (festivalIds?.length) {
    filter.festival = { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  const tags = await Event.distinct("extraTag", filter);
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

export async function getPopularExtraTags(limit = 10, festivalIds?: string[]) {
  await connectToDatabase();

  const pipeline: any[] = [];
  if (festivalIds?.length) {
    pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
  }
  pipeline.push(
    { $unwind: "$extraTag" },
    { $match: { extraTag: { $ne: null } } },
    { $group: { _id: "$extraTag", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  );

  const results = await Event.aggregate(pipeline);
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

export async function getRarestFandoms(limit = 5, festivalIds?: string[]) {
  await connectToDatabase();
  const pipeline: any[] = [];
  if (festivalIds?.length) {
    pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
  }
  pipeline.push(
    { $unwind: '$images' },
    { $unwind: '$images.category' },
    { $lookup: { from: 'categories', localField: 'images.category', foreignField: '_id', as: 'categoryDoc' } },
    { $unwind: '$categoryDoc' },
    { $match: { 'categoryDoc.type': 'fandom', $and: [ { 'categoryDoc.name': { $ne: null } }, { 'categoryDoc.name': { $ne: '' } } ] } },
    { $group: { _id: { lower: { $toLower: '$categoryDoc.name' } }, name: { $first: '$categoryDoc.name' }, count: { $sum: 1 }, eventId: { $first: '$_id' }, eventTitle: { $first: '$title' } } },
    { $match: { count: { $gt: 0 } } },
    { $sort: { count: 1 } },
    { $addFields: { randomValue: { $rand: {} } } },
    { $sort: { count: 1, randomValue: 1 } },
    { $limit: limit }
  );
  const results = await Event.aggregate(pipeline);
  return results.map((r: any) => ({ name: r.name, value: r.count, eventId: r.eventId?.toString(), eventTitle: r.eventTitle }));
}

export async function getRarestItemTypes(limit = 5, festivalIds?: string[]) {
  await connectToDatabase();
  const pipeline: any[] = [];
  if (festivalIds?.length) {
    pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
  }
  pipeline.push(
    { $unwind: '$images' },
    { $unwind: '$images.category' },
    { $lookup: { from: 'categories', localField: 'images.category', foreignField: '_id', as: 'categoryDoc' } },
    { $unwind: '$categoryDoc' },
    { $match: { 'categoryDoc.type': 'itemType', $and: [ { 'categoryDoc.name': { $ne: null } }, { 'categoryDoc.name': { $ne: '' } } ] } },
    { $group: { _id: { lower: { $toLower: '$categoryDoc.name' } }, name: { $first: '$categoryDoc.name' }, count: { $sum: 1 }, eventId: { $first: '$_id' }, eventTitle: { $first: '$title' } } },
    { $match: { count: { $gt: 0 } } },
    { $sort: { count: 1 } },
    { $addFields: { randomValue: { $rand: {} } } },
    { $sort: { count: 1, randomValue: 1 } },
    { $limit: limit }
  );
  const results = await Event.aggregate(pipeline);
  return results.map((r: any) => ({ name: r.name, value: r.count, eventId: r.eventId?.toString(), eventTitle: r.eventTitle }));
}

export async function getMostBookmarkedEvents(limit = 5, festivalIds?: string[]) {
  await connectToDatabase();
  const pipeline: any[] = [];
  if (festivalIds?.length) {
    pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
  }
  pipeline.push(
    { $lookup: { from: 'orders', localField: '_id', foreignField: 'event', as: 'orders' } },
    { $addFields: { bookmarkCount: { $size: '$orders' } } },
    { $sort: { bookmarkCount: -1 } },
    { $limit: limit },
    { $project: { _id: 1, title: 1, bookmarkCount: 1, images: { $slice: ['$images', 1] } } }
  );
  const results = await Event.aggregate(pipeline);
  return results.map((e: any) => ({ id: e._id.toString(), title: e.title, count: e.bookmarkCount, imageUrl: e.images?.[0]?.imageUrl || '' }));
}

// GET FEATURED PRODUCTS (events that have a featuredProduct set)
export async function getFeaturedProducts(festivalIds?: string[]) {
  try {
    await connectToDatabase();
    const query: any = {
      'featuredProduct.imageUrl': { $exists: true, $ne: '' },
      'featuredProduct.description': { $exists: true, $ne: '' },
    };
    if (festivalIds?.length) {
      query.festival = { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    const events = await populateEvent(
      Event.find(query).sort({ createdAt: -1 }).limit(12)
    );
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET EVENTS WITH DEALS (events that have dealBadge set)
export async function getDealsEvents(festivalIds?: string[]) {
  try {
    await connectToDatabase();

    // Find category IDs that match "freebie" (case-insensitive)
    const freebieCategories = await Category.find({ name: { $regex: /freebie/i } });
    const freebieCatIds = freebieCategories.map((c: any) => c._id);

    const query: any = {
      $or: [
        { dealBadge: { $exists: true, $ne: '' } },
        ...(freebieCatIds.length ? [{ 'images.category': { $in: freebieCatIds } }] : []),
      ],
    };
    if (festivalIds?.length) {
      query.festival = { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    const events = await populateEvent(
      Event.find(query).sort({ createdAt: -1 }).limit(12)
    );
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET ALL ARTISTS (deduplicated, with event count)
export async function getAllArtists(festivalIds?: string[]) {
  try {
    await connectToDatabase();
    const pipeline: any[] = [];
    if (festivalIds?.length) {
      pipeline.push({ $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } });
    }
    pipeline.push(
      { $unwind: '$artists' },
      { $match: { 'artists.name': { $nin: [null, ''] } } },
      {
        $group: {
          _id: { $toLower: '$artists.name' },
          name: { $first: '$artists.name' },
          link: { $first: '$artists.link' },
          eventCount: { $sum: 1 },
          eventIds: { $push: '$_id' },
        }
      },
      { $sort: { name: 1 } }
    );
    const results = await Event.aggregate(pipeline);
    return results.map((r: any) => ({
      name: r.name,
      link: r.link || '',
      eventCount: r.eventCount,
    }));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET EVENTS BY ARTIST NAME
export async function getEventsByArtist(artistName: string) {
  try {
    await connectToDatabase();
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapeRegExp(artistName)}$`, 'i');
    const events = await populateEvent(
      Event.find({ 'artists.name': regex }).sort({ createdAt: -1 })
    );
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    handleError(error);
    return [];
  }
}

// GET BOOTH NEIGHBORS
export async function getBoothNeighbors(boothCode: string, range = 2) {
  try {
    await connectToDatabase();
    const match = boothCode.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return [];

    const prefix = match[1].toUpperCase();
    const num = parseInt(match[2], 10);
    const neighborCodes: string[] = [];
    for (let i = num - range; i <= num + range; i++) {
      if (i > 0 && i !== num) neighborCodes.push(`${prefix}${i}`);
    }

    // Find events whose title starts with any neighbor code
    const orConditions = neighborCodes.map(code => ({
      title: { $regex: `^${code}\\b`, $options: 'i' }
    }));

    if (!orConditions.length) return [];
    const events = await populateEvent(
      Event.find({ $or: orConditions }).limit(10)
    );
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function getBoothEventMap(festivalId?: string, festivalDay?: number): Promise<BoothEventMap> {
  try {
    await connectToDatabase();
    const filter: any = {};
    if (festivalId) {
      filter.festival = festivalId;
    }
    // Day filter: only events that attend the given festival day
    if (festivalDay) {
      filter.attendDays = festivalDay;
    }
    const events = await Event.find(filter, 'title images startDateTime endDateTime hasPreorder attendDays').lean();

    const boothEvents: { [boothCode: string]: any[] } = {};

    // First pass: collect all events by booth code
    for (const event of events) {
      const parsed = parseBooth(event.title);
      if (!parsed) continue;

      const eventData = {
        eventId: (event._id as  Schema.Types.ObjectId).toString(),
        title: event.title,
        boothLabel: parsed.label,
        boothName: parsed.boothName,
        images: event.images?.map((img: any) => img.imageUrl).filter(Boolean) || [],
        hasPreorder: event.hasPreorder === 'Yes',
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime
      };

      // Add event to each booth code it belongs to
      for (const code of parsed.codes) {
        if (!boothEvents[code]) {
          boothEvents[code] = [];
        }
        boothEvents[code].push(eventData);
      }
    }

    // Second pass: consolidate events per booth
    const map: BoothEventMap = {};

    for (const [boothCode, events] of Object.entries(boothEvents)) {
      if (events.length === 0) continue;

      // Sort events by start date if available
      events.sort((a, b) => {
        if (a.startDateTime && b.startDateTime) {
          return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
        }
        return 0;
      });

      // Use the first/primary event for main display
      const primaryEvent = events[0];

      // Collect all unique images from all events in this booth
      const allImages = [...new Set(events.flatMap(e => e.images))].filter(Boolean);

      // Determine if any event has preorder
      const hasAnyPreorder = events.some(e => e.hasPreorder);

      // Create consolidated booth name (prefer non-empty names)
      const consolidatedBoothName = events
        .map(e => e.boothName)
        .find(name => name && name.trim()) || primaryEvent.boothName;

      // Use the primary event's title directly (no generic message)
      const consolidatedTitle = primaryEvent.title;

      map[boothCode] = {
        eventId: primaryEvent.eventId,
        title: consolidatedTitle,
        boothLabel: primaryEvent.boothLabel,
        boothName: consolidatedBoothName,
        thumb: allImages[0] || '/assets/images/broken-image.png',
        hasPreorder: hasAnyPreorder,
        // Enhanced fields for multi-event support
        allEvents: events,
        images: allImages,
        totalEvents: events.length
      };
    }

    return map;
  } catch (error) {
    handleError(error);
    return {};
  }
}

export async function getEventByBoothCode(boothCode: string) {
  try {
    await connectToDatabase();
    const normalizedCode = boothCode.toUpperCase().trim();

    // Find event where title starts with the booth code
    const event = await Event.findOne({
      title: { $regex: `^${normalizedCode}(?:\\s*-|\\s|$)`, $options: 'i' }
    }).populate('organizer', '_id firstName lastName').lean();

    if (!event) return null;

    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    handleError(error);
    return null;
  }
}