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

type CategoryFilterProps = {
  categoryFilterType: string;
};

const CategoryFilter = ({ categoryFilterType }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      console.log(`Fetching categories for: ${categoryFilterType}`);
      const categoryList = await getAllCategories(categoryFilterType);
      setCategories(categoryList || []);
      setIsLoading(false);
    };
    fetchCategories();
  }, [categoryFilterType]);

  // Handle category selection change
  const onSelectCategory = (category: string) => {
    setSelectedCategory(category);

    const currentParams = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      currentParams.delete(categoryFilterType);
    } else {
      currentParams.set(categoryFilterType, category);
    }

    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sync selected category with URL params
  useEffect(() => {
    const currentCategory = searchParams.get(categoryFilterType) || "All";
    if (currentCategory !== selectedCategory) {
      setSelectedCategory(currentCategory);
    }
  }, [searchParams, categoryFilterType]);

  return (
    <Select 
      value={selectedCategory} 
      onValueChange={onSelectCategory}
      disabled={isLoading}
    >
      <SelectTrigger className={`select-field ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
        <SelectValue placeholder={isLoading ? "Tải tag..." : "Chọn tag"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">Bất kì</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category._id} value={category.name}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategoryFilter;