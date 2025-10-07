"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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

// Caching utility functions
const CategoryCache = {
  get: (type: string) => {
    try {
      const cached = localStorage.getItem(`categories_${type}`);
      const cachedData = cached ? JSON.parse(cached) : null;
      
      // Check if cache is still valid (within 24 hours)
      if (cachedData && cachedData.timestamp) {
        const hoursSinceCache = (Date.now() - cachedData.timestamp) / (1000 * 60 * 60);
        if (hoursSinceCache < 24) {
          return cachedData.categories;
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading category cache:', error);
      return null;
    }
  },
  
  set: (type: string, categories: ICategory[]) => {
    try {
      const cacheEntry = {
        categories,
        timestamp: Date.now()
      };
      localStorage.setItem(`categories_${type}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error setting category cache:', error);
    }
  },

  clear: (type: string) => {
    localStorage.removeItem(`categories_${type}`);
  }
};

const CategoryFilter = ({ categoryFilterType }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch categories with intelligent caching
  useEffect(() => {
    const fetchCategories = async () => {
      // Try to get cached categories first
      const cachedCategories = CategoryCache.get(categoryFilterType);
      
      if (cachedCategories) {
        setCategories(cachedCategories);
        setIsLoading(false);
        return;
      }

      // If no valid cache, fetch from server
      try {
        setIsLoading(true);
        const categoryList = await getAllCategories(categoryFilterType);
        
        // Ensure we have an array
        const validCategories = Array.isArray(categoryList) ? categoryList : [];
        
        // Set categories and cache them
        setCategories(validCategories);
        CategoryCache.set(categoryFilterType, validCategories);
      } catch (error) {
        console.error(`Error fetching ${categoryFilterType} categories:`, error);
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
    // Reset pagination to first page when changing category filter
    currentParams.delete('page'); // removing lets server default to page 1
    // Alternatively: currentParams.set('page', '1');

    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sync selected category with URL params
  useEffect(() => {
    const currentCategory = searchParams.get(categoryFilterType) || "All";
    if (currentCategory !== selectedCategory) {
      setSelectedCategory(currentCategory);
    }
  }, [searchParams, categoryFilterType, selectedCategory]);

  // Memoized filtered categories
  const filteredCategories = useMemo(() => 
    categories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), 
    [categories, searchQuery]
  );

  const displayValue = selectedCategory === "All" ? "Bất kì" : selectedCategory;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between min-w-0 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 min-w-0 w-full">
            <span className="block flex-1 min-w-0 max-w-full truncate break-words text-left">{displayValue}</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
  
      {!isLoading && (
        <PopoverContent className="w-full p-0">
          <div className="w-full">
            <div className="flex w-full items-center border-b px-3">
              <input
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tìm kiếm tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
  
            <div className="max-h-72 overflow-y-auto">
              <div
                className={cn(
                  "relative flex cursor-default select-none items-start gap-1 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  selectedCategory === "All" ? "bg-accent text-accent-foreground" : ""
                )}
                onClick={() => onSelectCategory("All")}
              >
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    selectedCategory === "All" ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="block break-words whitespace-normal leading-snug max-w-full">Bất kì</span>
              </div>
  
              {filteredCategories.length === 0 ? (
                <div className="py-6 text-center text-sm">Không tìm thấy tag.</div>
              ) : (
                filteredCategories.map((category) => (
                  <div
                    key={category._id}
                    className={cn(
                      "relative flex cursor-default select-none items-start gap-1 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      selectedCategory === category.name ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => onSelectCategory(category.name)}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        selectedCategory === category.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="block break-words whitespace-normal leading-snug max-w-full">
                      {category.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
};

export default CategoryFilter;