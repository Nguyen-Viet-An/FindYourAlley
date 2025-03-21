'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import { handleError } from '@/lib/utils'
import mongoose from 'mongoose';

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from '@/types'

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: 'i' } })
}

const getCategoriesByNames = async (names: string | string[]) => {
  const nameArray = Array.isArray(names) ? names : [names]; // Ensure names is an array
  // // console.log("Searching for categories:", nameArray);
  const categories = await Category.find({ name: { $in: nameArray.map(name => new RegExp(`^${name}$`, 'i')) } });
  // // console.log("Found categories:", categories);

  return categories;
};

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    .populate({ path: 'images.category', model: Category, select: '_id name type' }); // Populate categories inside images
};

export const convertToObjectIdArray = async (stringIds: string[]): Promise<mongoose.Types.ObjectId[]> => {
  return stringIds.map(id => new mongoose.Types.ObjectId(id));
}

// CREATE
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

    const eventData = {
      title,
      description,
      artists: artists || [], // add artists array
      images: formattedImages,
      startDateTime,
      endDateTime,
      extraTag,
      url,
      hasPreorder: hasPreorder || "No",
      organizer: userId,
    };

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

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      {
        $set: {
          title: event.title,
          description: event.description,
          artists: event.artists || [], // update artists array
          images: formattedImages,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          hasPreorder: event.hasPreorder || "No",
          extraTag: event.extraTag,
          url: event.url,
        },
      },
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
    if (deletedEvent) revalidatePath(path)
  } catch (error) {
    handleError(error)
  }
}

// GET ALL EVENTS
// Update the getAllEvents function to include category info in the response
export async function getAllEvents({ query, limit = 6, page, fandom, itemType, hasPreorder }: GetAllEventsParams) {
  try {
    await connectToDatabase();

    // Start with a basic query object
    const queryObject: any = {};

    // Add title, extraTag, and artist name search if provided
    if (query) {
      queryObject.$or = [
        { title: { $regex: query, $options: "i" } },
        { extraTag: { $regex: query, $options: "i" } }, // Search in extraTag field
        { "artists.name": { $regex: query, $options: "i" } } // Search in artist names
      ];
    }

    // Add hasPreorder filter if provided
    if (hasPreorder) {
      queryObject.hasPreorder = hasPreorder;
    }

    // Store the category IDs we're looking for to pass to the front end
    let requestedCategoryIds: string[] = [];

    // Fetch categories by name for both fandom and itemType
    if ((fandom && fandom.length > 0) || (itemType && itemType.length > 0)) {
      const categories = await getCategoriesByNames([...(fandom || []), ...(itemType || [])]);
      
      if (categories.length > 0) {
        // Create an array of ObjectIds from the category documents
        const categoryIds = categories.map(cat => new mongoose.Types.ObjectId(cat._id));
        requestedCategoryIds = categories.map(cat => cat._id.toString());
        
        // Match events where images contain both the fandom and itemType categories
        queryObject["images.category"] = { $all: categoryIds }; // Use $all to ensure both categories are matched
      }
    }

    const skipAmount = (Number(page) - 1) * limit;
    const eventsQuery = Event.find(queryObject)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(queryObject);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
      requestedCategoryIds // Pass the requested category IDs
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

// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategories({
  categoryIds,
  requestedCategoryIds,
  eventId,
  limit = 5,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit

    // Updated condition to match events where at least one image has one of the categories
    const conditions = { $and: [
        { "images.category": { $in: categoryIds } }, // Match events where at least one image contains one of the categories
        { _id: { $ne: eventId } },                  // Exclude the current event
      ],
    };


    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)

    // console.log("Get events by category condition:", JSON.stringify(conditions, null, 2));
    const events = await populateEvent(eventsQuery)
    const eventsCount = await Event.countDocuments(conditions)

    // console.log(`Found ${eventsCount} matching events`);
    // console.log("Returned events:", JSON.stringify(events, null, 2));
    // Return requestedCategoryIds alongside the event data
    return { 
      data: JSON.parse(JSON.stringify(events)), 
      totalPages: Math.ceil(eventsCount / limit),
      requestedCategoryIds: requestedCategoryIds, // Return the requested categories
    }
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