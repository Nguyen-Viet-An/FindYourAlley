import { Document, Schema, model, models } from "mongoose";

export interface ICategory extends Document {
  _id: string;
  name: string;
  type: string;
  approved: boolean;
}

const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  approved: { type: Boolean, default: false },
})

const Category = models.Category || model('Category', CategorySchema);

export default Category;