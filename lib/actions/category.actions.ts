"use server"

import { CreateCategoryParams } from "@/types"
import { handleError } from "../utils"
import { connectToDatabase } from "../database"
import Category from "../database/models/category.model"
import Event from "../database/models/event.model"
import mongoose from "mongoose"
import { revalidatePath } from "next/cache"

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

export const createCategory = async ({ categoryName, categoryType }: CreateCategoryParams) => {
  try {
    await connectToDatabase();

    if (!categoryType) {
      throw new Error('Category type is required');
    }

    // Auto-normalize: trim, capitalize first letter
    const trimmed = categoryName.trim().replace(/\s+/g, ' ');
    const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    // Check if already exists (case-insensitive)
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${formattedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (existing) return JSON.parse(JSON.stringify(existing));

    const newCategory = await Category.create({ name: formattedName, type: categoryType });

    return JSON.parse(JSON.stringify(newCategory));
  } catch (error) {
    handleError(error)
  }
}

export const getAllCategories = async (type?: string, approvedOnly: boolean = true) => {
  try {
    await connectToDatabase();

    const filter: any = {};
    if (type) filter.type = type;
    if (approvedOnly) filter.approved = true;

    const categories = await Category.find(filter).sort({ name: 1 });

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

// ─── Admin actions ───────────────────────────────────────────

export const getAllCategoriesAdmin = async (userId: string) => {
  try {
    if (userId !== ADMIN_USER_ID) throw new Error('Unauthorized');
    await connectToDatabase();

    const categories = await Category.find().sort({ name: 1 });

    // Count usage per category
    const usageCounts = await Event.aggregate([
      { $unwind: "$images" },
      { $unwind: "$images.category" },
      { $group: { _id: "$images.category", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(usageCounts.map((u: any) => [u._id.toString(), u.count]));

    const result = categories.map((c: any) => ({
      _id: c._id.toString(),
      name: c.name,
      type: c.type,
      approved: c.approved ?? false,
      usageCount: countMap.get(c._id.toString()) || 0,
    }));

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleError(error);
  }
};

export const renameCategory = async (userId: string, categoryId: string, newName: string) => {
  try {
    if (userId !== ADMIN_USER_ID) throw new Error('Unauthorized');
    await connectToDatabase();

    const trimmed = newName.trim().replace(/\s+/g, ' ');
    const updated = await Category.findByIdAndUpdate(categoryId, { name: trimmed }, { new: true });
    if (!updated) throw new Error('Category not found');

    revalidatePath('/');
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    handleError(error);
  }
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  try {
    if (userId !== ADMIN_USER_ID) throw new Error('Unauthorized');
    await connectToDatabase();

    // Remove category from all event images
    await Event.updateMany(
      { "images.category": categoryId },
      { $pull: { "images.$[].category": new mongoose.Types.ObjectId(categoryId) } }
    );

    await Category.findByIdAndDelete(categoryId);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    handleError(error);
  }
};

export const mergeCategories = async (userId: string, sourceId: string, targetId: string) => {
  try {
    if (userId !== ADMIN_USER_ID) throw new Error('Unauthorized');
    await connectToDatabase();

    const sourceOid = new mongoose.Types.ObjectId(sourceId);
    const targetOid = new mongoose.Types.ObjectId(targetId);

    // Replace source with target in all event images that have source
    await Event.updateMany(
      { "images.category": sourceOid },
      { $addToSet: { "images.$[elem].category": targetOid } },
      { arrayFilters: [{ "elem.category": sourceOid }] }
    );

    // Then remove source
    await Event.updateMany(
      { "images.category": sourceOid },
      { $pull: { "images.$[].category": sourceOid } }
    );

    // Delete the source category
    await Category.findByIdAndDelete(sourceId);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    handleError(error);
  }
};

export const approveCategory = async (userId: string, categoryId: string) => {
  try {
    if (userId !== ADMIN_USER_ID) throw new Error('Unauthorized');
    await connectToDatabase();

    const updated = await Category.findByIdAndUpdate(categoryId, { approved: true }, { new: true });
    if (!updated) throw new Error('Category not found');

    revalidatePath('/');
    return JSON.parse(JSON.stringify(updated));
  } catch (error) {
    handleError(error);
  }
};