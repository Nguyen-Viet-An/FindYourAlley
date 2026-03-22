import { Schema, model, models, Document } from "mongoose";

export interface IEmailCounter extends Document {
  month: string; // "2026-03"
  count: number;
}

const EmailCounterSchema = new Schema({
  month: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
});

const EmailCounter = models.EmailCounter || model("EmailCounter", EmailCounterSchema);

export default EmailCounter;
