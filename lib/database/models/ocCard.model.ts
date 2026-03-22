import { Document, Schema, model, models } from "mongoose";

export interface IOcCard extends Document {
  _id: string;
  owner: { _id: string; firstName: string; lastName: string };
  ownerName: string;
  images: { ocName: string; artistName?: string; imageUrl: string; description?: string }[];
  festival?: { _id: string; name: string }[];
  eventTime?: string;
  location?: string;
  appearance?: { text?: string; imageUrl?: string };
  contactMethod?: string;
  available: boolean;
  createdAt: Date;
}

const OcCardSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  ownerName: { type: String, required: true },
  images: [
    {
      ocName: { type: String, required: true, maxlength: 100 },
      artistName: { type: String, maxlength: 100 },
      imageUrl: { type: String, required: true },
      description: { type: String, maxlength: 200 },
    },
  ],
  festival: [{ type: Schema.Types.ObjectId, ref: 'Festival' }],
  eventTime: { type: String, maxlength: 200 },
  location: { type: String, maxlength: 300 },
  appearance: {
    text: { type: String, maxlength: 300 },
    imageUrl: { type: String },
  },
  contactMethod: { type: String, maxlength: 300 },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

OcCardSchema.index({ owner: 1, createdAt: -1 });

const OcCard = models.OcCard || model("OcCard", OcCardSchema);
export default OcCard;
