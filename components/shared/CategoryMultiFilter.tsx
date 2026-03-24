"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllCategories } from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";

type Props = {
  categoryFilterType: string;
  /** URL param key for exclude, e.g. "excludeFandom" */
  excludeParamKey?: string;
  /** Virtual items pinned at the top of the list (not from DB) */
  pinnedItems?: { id: string; name: string; emoji?: string }[];
};

const CategoryCache = {
  get: (type: string) => {
    try {
      const cached = localStorage.getItem(`categories_${type}`);
      const d = cached ? JSON.parse(cached) : null;
      if (d?.timestamp && (Date.now() - d.timestamp) / 36e5 < 24) return d.categories;
      return null;
    } catch { return null; }
  },
  set: (type: string, categories: ICategory[]) => {
    try {
      localStorage.setItem(`categories_${type}`, JSON.stringify({ categories, timestamp: Date.now() }));
    } catch {}
  },
};

export default function CategoryMultiFilter({ categoryFilterType, excludeParamKey, pinnedItems = [] }: Props) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current selected (include) values from URL
  const selected: string[] = useMemo(() => {
    const raw = searchParams.get(categoryFilterType);
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams, categoryFilterType]);

  // Current excluded values from URL
  const excluded: string[] = useMemo(() => {
    if (!excludeParamKey) return [];
    const raw = searchParams.get(excludeParamKey);
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [searchParams, excludeParamKey]);

  useEffect(() => {
    const fetch = async () => {
      const cached = CategoryCache.get(categoryFilterType);
      if (cached) { setCategories(cached); setIsLoading(false); return; }
      try {
        setIsLoading(true);
        const list = await getAllCategories(categoryFilterType);
        const valid = Array.isArray(list) ? list : [];
        setCategories(valid);
        CategoryCache.set(categoryFilterType, valid);
      } catch { setCategories([]); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [categoryFilterType]);

  const updateUrl = (include: string[], exclude: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (include.length) params.set(categoryFilterType, include.join(","));
    else params.delete(categoryFilterType);
    if (excludeParamKey) {
      if (exclude.length) params.set(excludeParamKey, exclude.join(","));
      else params.delete(excludeParamKey);
    }
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const toggleInclude = (name: string) => {
    const newExcl = excluded.filter((n) => n !== name);
    const newIncl = selected.includes(name)
      ? selected.filter((n) => n !== name)
      : [...selected, name];
    updateUrl(newIncl, newExcl);
  };

  const toggleExclude = (name: string) => {
    const newIncl = selected.filter((n) => n !== name);
    const newExcl = excluded.includes(name)
      ? excluded.filter((n) => n !== name)
      : [...excluded, name];
    updateUrl(newIncl, newExcl);
  };

  const clearAll = () => updateUrl([], []);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [categories, searchQuery]
  );

  const filteredPinned = useMemo(
    () => pinnedItems.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [pinnedItems, searchQuery]
  );

  const displayText =
    selected.length === 0 && excluded.length === 0
      ? "Bất kì"
      : [
          ...selected.map((n) => n),
          ...excluded.map((n) => `−${n}`),
        ].join(", ");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between min-w-0 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 min-w-0 w-full">
            <span className="block flex-1 min-w-0 max-w-full truncate text-left">{displayText}</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      {!isLoading && (
        <PopoverContent className="w-72 p-0">
          <div className="flex w-full items-center border-b px-3">
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {(selected.length > 0 || excluded.length > 0) && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b">
              <span className="text-xs text-muted-foreground">
                {selected.length} chọn, {excluded.length} blacklist
              </span>
              <button onClick={clearAll} className="text-xs text-primary-500 hover:underline">Xóa tất cả</button>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {/* Pinned items at top */}
            {filteredPinned.map((pin) => {
              const isIncluded = selected.includes(pin.name);
              return (
                <div
                  key={pin.id}
                  className={cn(
                    "relative flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm border-b",
                    isIncluded && "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-medium"
                  )}
                >
                  <button
                    className="flex-1 flex items-center gap-1 text-left hover:bg-accent/50 rounded-sm px-1"
                    onClick={() => toggleInclude(pin.name)}
                  >
                    <Check className={cn("h-4 w-4 shrink-0", isIncluded ? "opacity-100" : "opacity-0")} />
                    <span className="break-words whitespace-normal leading-snug">
                      {pin.emoji && `${pin.emoji} `}{pin.name}
                    </span>
                  </button>
                </div>
              );
            })}
            {filteredCategories.length === 0 && filteredPinned.length === 0 ? (
              <div className="py-6 text-center text-sm">Không tìm thấy.</div>
            ) : (
              filteredCategories.map((cat) => {
                const isIncluded = selected.includes(cat.name);
                const isExcluded = excluded.includes(cat.name);
                return (
                  <div
                    key={cat._id}
                    className={cn(
                      "relative flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm",
                      isIncluded && "bg-accent text-accent-foreground",
                      isExcluded && "bg-destructive/10 text-destructive line-through"
                    )}
                  >
                    <button
                      className="flex-1 flex items-center gap-1 text-left hover:bg-accent/50 rounded-sm px-1"
                      onClick={() => toggleInclude(cat.name)}
                    >
                      <Check className={cn("h-4 w-4 shrink-0", isIncluded ? "opacity-100" : "opacity-0")} />
                      <span className="break-words whitespace-normal leading-snug">{cat.name}</span>
                    </button>
                    {excludeParamKey && (
                      <button
                        onClick={() => toggleExclude(cat.name)}
                        className={cn(
                          "shrink-0 p-0.5 rounded hover:bg-destructive/20",
                          isExcluded && "text-destructive"
                        )}
                        title="Blacklist"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      )}
    </Popover>
  );
}
