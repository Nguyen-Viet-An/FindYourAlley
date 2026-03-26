import { Document, Schema, model, models } from "mongoose";

export interface ITradeRequest extends Document {
  _id: string;
  card: { _id: string; ownerName: string; images: any[] };
  requester: { _id: string; firstName: string; lastName: string };
  message?: string;
  contactMethod?: string;
  linkedCard?: { _id: string; ownerName: string; images: any[] };
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
}

const TradeRequestSchema = new Schema({
  card: { type: Schema.Types.ObjectId, ref: "OcCard", required: true },
  requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
  imageIndex: { type: Number, default: 0 },
  message: { type: String, maxlength: 500 },
  contactMethod: { type: String, maxlength: 300 },
  linkedCard: { type: Schema.Types.ObjectId, ref: "OcCard" },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

TradeRequestSchema.index({ card: 1, createdAt: -1 });
TradeRequestSchema.index({ requester: 1 });
// Prevent duplicate requests: one requester per card per image
TradeRequestSchema.index({ card: 1, requester: 1, imageIndex: 1 }, { unique: true });

const TradeRequest =
  models.TradeRequest || model("TradeRequest", TradeRequestSchema);
export default TradeRequest;
