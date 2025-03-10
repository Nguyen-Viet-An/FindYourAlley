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
  // console.log("Searching for categories:", nameArray);
  const categories = await Category.find({ name: { $in: nameArray.map(name => new RegExp(`^${name}$`, 'i')) } });
  // console.log("Found categories:", categories);

  return categories;
};

const populateEvent = (query: any) => {
  return query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    .populate({ path: 'category', model: Category, select: '_id name type' })
}

export const convertToObjectIdArray = async (stringIds: string[]): Promise<mongoose.Types.ObjectId[]> => {
  return stringIds.map(id => new mongoose.Types.ObjectId(id));
}

// CREATE
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    await connectToDatabase();
    
    // Extract fields from the event
    const {
      title,
      description,
      location,
      imageUrl,
      startDateTime,
      endDateTime,
      categoryIds,
      itemTypeIds,
      hasPreorder,
      price,
      isFree,
      url
    } = event;
    
    // Create a new object with exactly what we want to save
    const eventData = {
      title,
      description,
      location,
      imageUrl,
      startDateTime,
      endDateTime,
      price,
      isFree,
      url,
      hasPreorder: hasPreorder || "No",
      category: await convertToObjectIdArray([...(categoryIds || []), ...(itemTypeIds || [])]),
      organizer: userId
    };
    
    // console.log("Creating with explicit fields:", JSON.stringify(eventData, null, 2));
    
    const newEvent = await Event.create(eventData);
    
    // console.log("newEvents:", JSON.stringify(newEvent, null, 2));
    revalidatePath(path);
    return JSON.parse(JSON.stringify(newEvent));
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

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase()

    const eventToUpdate = await Event.findById(event._id)
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error('Unauthorized or event not found')
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { ...event, category: [...(event.categoryIds || []), ...(event.itemTypeIds || [])]},
      { new: true }
    )
    revalidatePath(path)

    return JSON.parse(JSON.stringify(updatedEvent))
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
export async function getAllEvents({ query, limit = 6, page, fandom, itemType, hasPreorder }: GetAllEventsParams) {
  try {
    await connectToDatabase();

    const titleCondition = query ? { title: { $regex: query, $options: "i" } } : {};

    // Fetch categories by type
    const categories = await getCategoriesByNames([...fandom || [], ...itemType || []]);

    // Create category filtering conditions based on type
    const fandomIds = categories.filter(cat => cat.type === "fandom").map(cat => cat._id);
    const itemTypeIds = categories.filter(cat => cat.type === "itemType").map(cat => cat._id);

    // Combine all category IDs into a single array
    const categoryCondition = fandomIds.length && itemTypeIds.length 
      ? { category: { $all: [...fandomIds, ...itemTypeIds] } } 
      : fandomIds.length 
      ? { category: { $all: fandomIds } } 
      : itemTypeIds.length 
      ? { category: { $all: itemTypeIds } } 
      : {};

        
    // Create hasPreorder condition
    const hasPreorderCondition = hasPreorder ? { hasPreorder } : {};
    
    // Combine all conditions
    const conditions = {
      $and: [
        titleCondition,
        categoryCondition,
        hasPreorderCondition, // Include preorder filtering
      ],
    };

    console.log("Final Query Conditions:", JSON.stringify(conditions, null, 2));
    const skipAmount = (Number(page) - 1) * limit;
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
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
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit

    // Updated condition to match at least one category
    const conditions = { $and: [
        { category: { $in: categoryIds } }, // Match events where at least one category matches
        { _id: { $ne: eventId } },          // Exclude the current event
      ],
    };

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