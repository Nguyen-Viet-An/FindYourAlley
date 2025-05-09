"use server"

import { CreateCategoryParams } from "@/types"
import { handleError } from "../utils"
import { connectToDatabase } from "../database"
import Category from "../database/models/category.model"

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