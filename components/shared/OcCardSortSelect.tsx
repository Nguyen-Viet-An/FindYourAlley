"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "alphabetical", label: "A → Z" },
];

export default function OcCardSortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sortBy") || "newest";
  const [open, setOpen] = useState(false);

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sortBy");
    else params.set("sortBy", value);
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  const currentLabel = sortOptions.find((o) => o.value === current)?.label || "Mới nhất";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          title={`Sắp xếp: ${currentLabel}`}
        >
          <ArrowUpDown className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex w-full items-center rounded-sm px-3 py-2 text-sm hover:bg-accent transition-colors",
              current === opt.value && "bg-accent font-medium"
            )}
          >
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
