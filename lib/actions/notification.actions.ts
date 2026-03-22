"use server";

import { connectToDatabase } from "@/lib/database";
import NotificationSub from "@/lib/database/models/notificationSub.model";
import { handleError } from "@/lib/utils";

export async function getNotificationSub(userId: string) {
  try {
    await connectToDatabase();
    const sub = await NotificationSub.findOne({ userId });
    return sub ? JSON.parse(JSON.stringify(sub)) : null;
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function upsertNotificationSub({
  userId,
  email,
  fandoms,
  itemTypes,
  active,
}: {
  userId: string;
  email: string;
  fandoms: string[];
  itemTypes: string[];
  active: boolean;
}) {
  try {
    await connectToDatabase();
    const sub = await NotificationSub.findOneAndUpdate(
      { userId },
      { userId, email, fandoms, itemTypes, active },
      { upsert: true, new: true }
    );
    return JSON.parse(JSON.stringify(sub));
  } catch (error) {
    handleError(error);
    return null;
  }
}

export async function deleteNotificationSub(userId: string) {
  try {
    await connectToDatabase();
    await NotificationSub.deleteOne({ userId });
  } catch (error) {
    handleError(error);
  }
}

// Get all active subscribers who watch given category names
export async function getSubscribersForCategories(categoryNames: string[]) {
  try {
    await connectToDatabase();
    const subs = await NotificationSub.find({
      active: true,
      $or: [
        { fandoms: { $in: categoryNames } },
        { itemTypes: { $in: categoryNames } },
      ],
    });
    return JSON.parse(JSON.stringify(subs));
  } catch (error) {
    handleError(error);
    return [];
  }
}
