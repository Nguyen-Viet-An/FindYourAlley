"use server"

import { BookmarkOrderParams, CreateOrderParams, GetOrdersByEventParams, GetOrdersByUserParams, GetEventIdsOrderedByUserParams, FindOrderParams, DeleteOrderParams } from "@/types"
import { redirect } from 'next/navigation';
import { handleError } from '../utils';
import { connectToDatabase } from '../database';
import Order from '../database/models/order.model';
import Event from '../database/models/event.model';
import {ObjectId} from 'mongodb';
import User from '../database/models/user.model';


export const createOrder = async (order: CreateOrderParams & { note?: string }) => {
  try {
    await connectToDatabase();

    const newOrder = await Order.create({
      ...order,
      event: order.eventId,
      buyer: order.buyerId,
      imageIndex: order.imageIndex,
      note: order.note || ''
    });

    return JSON.parse(JSON.stringify(newOrder));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteOrder({ orderId }: DeleteOrderParams) {
  try {
    await connectToDatabase()

    // const deletedEvent = await Order.findByIdAndDelete(orderId)
    // console.log(deletedEvent)
    const result = await Order.deleteOne({ _id: orderId });
    if (result.deletedCount === 0) {
      console.error(`No order found with ID: ${orderId}`);
      // throw new Error(`Order with ID ${orderId} not found`);
    }
    console.log(`Order with ID ${orderId} successfully deleted`);
  } catch (error) {
    handleError(error)
  }
}


// GET ORDERS BY EVENT
export async function getOrdersByEvent({ searchString, eventId }: GetOrdersByEventParams) {
  try {
    await connectToDatabase()

    if (!eventId) throw new Error('Event ID is required')
    const eventObjectId = new ObjectId(eventId)

    const orders = await Order.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyer',
        },
      },
      {
        $unwind: '$buyer',
      },
      {
        $lookup: {
          from: 'events',
          localField: 'event',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          createdAt: 1,
          eventTitle: '$event.title',
          eventId: '$event._id',
          buyer: {
            $concat: ['$buyer.firstName', ' ', '$buyer.lastName'],
          },
        },
      },
      {
        $match: {
          $and: [{ eventId: eventObjectId }, { buyer: { $regex: RegExp(searchString, 'i') } }],
        },
      },
    ])

    return JSON.parse(JSON.stringify(orders))
  } catch (error) {
    handleError(error)
  }
}

// GET ORDERS BY USER
export async function getOrdersByUser({ userId, limit = 6, page }: GetOrdersByUserParams) {
  try {
    await connectToDatabase()

    const skipAmount = (Number(page) - 1) * limit
    const conditions = { buyer: userId }

    // Get orders with full event details and imageIndex
    const orders = await Order.find(conditions)
      .sort({ createdAt: 'desc' })
      .skip(skipAmount)
      .limit(limit)
      .populate({
        path: 'event',
        model: Event,
        populate: {
          path: 'organizer',
          model: User,
          select: '_id firstName lastName',
        },
      })

    const ordersCount = await Order.countDocuments(conditions)

    // Return orders with their events and imageIndex
    return {
      data: JSON.parse(JSON.stringify(orders)),
      totalPages: Math.ceil(ordersCount / limit)
    }
  } catch (error) {
    handleError(error)
  }
}

export async function getEventIdsOrderedByUser({ userId }: GetEventIdsOrderedByUserParams) {
  try {
    await connectToDatabase()

    // Get all orders for this user
    const orders = await Order.find({ buyer: userId }).select('event imageIndex')

    // Create an array of objects containing both eventId and imageIndex
    const eventIdsWithImageIndex = orders.map(order => ({
      eventId: order.event.toString(),
      imageIndex: order.imageIndex
    }))

    return JSON.parse(JSON.stringify(eventIdsWithImageIndex))
  } catch (error) {
    handleError(error)
  }
}

export async function findOrder({ eventId, userId, imageIndex }: FindOrderParams) {
  try {
    await connectToDatabase();

    // Query the database to find the order including imageIndex
    const order = await Order.findOne({
      event: eventId,
      buyer: userId,
      ...(imageIndex !== undefined && { imageIndex }), // Include imageIndex if provided
    });

    return order ? JSON.parse(JSON.stringify(order)) : null;

  } catch (error) {
    console.error('Error finding order:', error);
    throw new Error('Failed to find order');
  }
}

export async function updateOrderNote(orderId: string, note: string) {
  try {
    await connectToDatabase();
    const updated = await Order.findByIdAndUpdate(orderId, { note }, { new: true });
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    handleError(error);
  }
}

export async function getBuyerCountForEvent(eventId: string): Promise<number> {
  try {
    await connectToDatabase();

    const buyerCount = await Order.countDocuments({ event: eventId });
    return buyerCount;
  } catch (error) {
    console.error('Error fetching buyer count:', error);
    return 0;
  }
}