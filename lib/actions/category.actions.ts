"use server"

import { CreateCategoryParams } from "@/types"
import { handleError } from "../utils"
import { connectToDatabase } from "../database"
import Category from "../database/models/category.model"
import mongoose from "mongoose"

export const createCategory = async ({ categoryName, categoryType }: CreateCategoryParams) => {
  try {
    await connectToDatabase();

    const newCategory = await Category.create({ name: categoryName, type: categoryType });
    if (!categoryType) {
      throw new Error('Category type is required');
    }

    return JSON.parse(JSON.stringify(newCategory));
  } catch (error) {
    handleError(error)
  }
}

export const getAllCategories = async (type?: string) => {
  try {
    await connectToDatabase();

    const filter = type ? { type } : {}; // Add filter only if 'type' is provided

    // Sort by the 'name' field (replace with your actual field name if necessary)
    const categories = await Category.find(filter).sort({ name: 1 }); // 1 for ascending order

    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    handleError(error);
  }
};

export const getCategoriesByFestival = async (type: string, festivalIds: string[]) => {
  try {
    await connectToDatabase();

    if (!festivalIds.length) return getAllCategories(type);

    const Event = (await import('../database/models/event.model')).default;
    const results = await Event.aggregate([
      { $match: { festival: { $in: festivalIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $unwind: "$images" },
      { $unwind: "$images.category" },
      {
        $lookup: {
          from: "categories",
          localField: "images.category",
          foreignField: "_id",
          as: "cat"
        }
      },
      { $unwind: "$cat" },
      { $match: { "cat.type": type } },
      { $group: { _id: "$cat._id", name: { $first: "$cat.name" }, type: { $first: "$cat.type" } } },
      { $sort: { name: 1 } }
    ]);

    return JSON.parse(JSON.stringify(results));
  } catch (error) {
    handleError(error);
  }
};