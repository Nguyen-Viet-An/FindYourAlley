"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllCategories } from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";
import { startTransition } from "react";

type CategoryFilterProps = {
  categoryFilterType: string;
};

const CategoryFilter = ({ categoryFilterType }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<ICategory[]>([]); // Categories state
  const [selectedCategory, setSelectedCategory] = useState<string>("All"); // Selected category state
  const [isLoaded, setIsLoaded] = useState(false); // Data loading state
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch categories when the component mounts
  useEffect(() => {
    console.log(`Fetching categories for: ${categoryFilterType}`);
    const fetchCategories = async () => {
      const categoryList = await getAllCategories(categoryFilterType);
      setCategories(categoryList || []);
      setIsLoaded(true);
    };
    fetchCategories();
  }, [categoryFilterType]);

  // Handle category selection change
  const onSelectCategory = (category: string) => {
    setSelectedCategory(category); // Update selected category state

    const currentParams = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      currentParams.delete(categoryFilterType); // Remove filter if "All" is selected
    } else {
      currentParams.set(categoryFilterType, category); // Set the selected category as a URL parameter
    }

    // Navigate to the updated URL
    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sync selected category with URL params
  useEffect(() => {
    const currentCategory = searchParams.get(categoryFilterType) || "All";
    setSelectedCategory(currentCategory); // Set the selected category based on URL params
  }, [searchParams, categoryFilterType]);

  // Render the component once the data is loaded
  return (
    <>
      {isLoaded ? (
        <Select value={selectedCategory} onValueChange={onSelectCategory}>
          <SelectTrigger className="select-field">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p>Loading categories...</p>
      )}
    </>
  );
};

export default CategoryFilter;