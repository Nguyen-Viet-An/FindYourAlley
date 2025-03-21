"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllCategories } from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";

// Instead of using the Command component directly, we'll create a simplified dropdown
// This avoids the iterator error that's occurring in the shadcn Command component

type CategoryFilterProps = {
  categoryFilterType: string;
};

const CategoryFilter = ({ categoryFilterType }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      console.log(`Fetching categories for: ${categoryFilterType}`);
      try {
        const categoryList = await getAllCategories(categoryFilterType);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [categoryFilterType]);

  // Handle category selection change
  const onSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setOpen(false);

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
  }, [searchParams, categoryFilterType, selectedCategory]);

  // Filter categories based on search query
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayValue = selectedCategory === "All" ? "Bất kì" : selectedCategory;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? "Tải tag..." : displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="w-full">
          {/* Search input */}
          <div className="flex w-full items-center border-b px-3">
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tìm kiếm tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Results list */}
          <div className="max-h-72 overflow-y-auto">
            {/* "All" option */}
            <div
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                selectedCategory === "All" ? "bg-accent text-accent-foreground" : ""
              )}
              onClick={() => onSelectCategory("All")}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedCategory === "All" ? "opacity-100" : "opacity-0"
                )}
              />
              <span>Bất kì</span>
            </div>
            
            {/* Filtered categories */}
            {filteredCategories.length === 0 ? (
              <div className="py-6 text-center text-sm">Không tìm thấy tag.</div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category._id}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    selectedCategory === category.name ? "bg-accent text-accent-foreground" : ""
                  )}
                  onClick={() => onSelectCategory(category.name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCategory === category.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{category.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryFilter;