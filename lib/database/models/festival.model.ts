import { Schema, model, models, Document } from 'mongoose';

export interface IFestival extends Document {
  name: string;
  code?: string; // short code like COFI15
  startDate?: Date;
  endDate?: Date;
  expiresAt?: Date; // festival hidden from filter after this date
  isActive: boolean;
  floorMapFile?: string; // filename of the .drawio.xml floor map
  boothFile?: string; // filename of the booth.json
  stampRallyFile?: string; // filename of the stamprally.json
}

const FestivalSchema = new Schema<IFestival>({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  floorMapFile: { type: String },
  boothFile: { type: String },
  stampRallyFile: { type: String },
}, { timestamps: true });

FestivalSchema.index({ name: 1 });
FestivalSchema.index({ code: 1 });

const Festival = models.Festival || model<IFestival>('Festival', FestivalSchema);
export default Festival;
