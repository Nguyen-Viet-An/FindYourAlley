import { Schema, model, models, Document } from "mongoose";

export interface INotificationSub extends Document {
  userId: string;
  email: string;
  fandoms: string[];    // category names to watch
  itemTypes: string[];  // category names to watch
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSubSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    fandoms: [{ type: String }],
    itemTypes: [{ type: String }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NotificationSub = models.NotificationSub || model("NotificationSub", NotificationSubSchema);

export default NotificationSub;
