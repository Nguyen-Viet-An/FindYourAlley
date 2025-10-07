import { Schema, model, models, Document } from 'mongoose';

export interface IFestival extends Document {
  name: string;
  code?: string; // short code like COFI15
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

const FestivalSchema = new Schema<IFestival>({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

FestivalSchema.index({ name: 1 });
FestivalSchema.index({ code: 1 });

const Festival = models.Festival || model<IFestival>('Festival', FestivalSchema);
export default Festival;
