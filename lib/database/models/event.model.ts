import { Document, Schema, model, models } from "mongoose";

export interface IImage {
  imageUrl: string;
  categoryIds: string[]; // fandom categories
  itemTypeIds: string[]; // item type categories 
}

export interface IEvent extends Document {
  _id: string;
  title: string;
  description?: string;
  artists: {
    name: string;
    link?: string;
  };
  createdAt: Date;
  images: {
    imageUrl: string;
    category: { _id: string; name: string; type: string }[];
  }[];
  startDateTime: Date;
  endDateTime: Date;
  extraTag?: string;
  url?: string;
  hasPreorder: "Yes" | "No" | undefined;
  organizer: { _id: string, firstName: string, lastName: string };
}

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    artists: [{
      name: { type: String, required: true },
      link: { type: String, required: false }
    }],
    createdAt: { type: Date, default: Date.now },
    images: [
      {
        imageUrl: { type: String, required: true },
        category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      },
    ],
    startDateTime: { type: Date, default: Date.now },
    endDateTime: { type: Date, default: Date.now },
    extraTag: { type: String },
    url: { type: String },
    hasPreorder: { type: String, enum: ["Yes", "No"], default: "No" },
    organizer: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { strict: false }
);

const Event = models.Event || model('Event', EventSchema);

export default Event;