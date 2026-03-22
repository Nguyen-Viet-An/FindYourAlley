import { Schema, model, models, Document } from "mongoose";

export interface INotificationQueue extends Document {
  userId: string;
  email: string;
  lastSentAt: Date | null;
  pendingEvents: {
    eventId: string;
    eventTitle: string;
    eventStartDate: Date | null;
    matchedCategories: string[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationQueueSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    lastSentAt: { type: Date, default: null },
    pendingEvents: [
      {
        eventId: { type: String, required: true },
        eventTitle: { type: String, required: true },
        eventStartDate: { type: Date, default: null },
        matchedCategories: [{ type: String }],
      },
    ],
  },
  { timestamps: true }
);

const NotificationQueue =
  models.NotificationQueue || model("NotificationQueue", NotificationQueueSchema);

export default NotificationQueue;
