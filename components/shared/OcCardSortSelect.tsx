"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sortKeys = [
  { value: "random", key: "random" },
  { value: "newest", key: "newest" },
  { value: "oldest", key: "oldest" },
  { value: "alphabetical", key: "aToZ" },
] as const;

export default function OcCardSortSelect() {
  const ts = useTranslations('sort');
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("sortBy") || "random";
  const [open, setOpen] = useState(false);

  const sortOptions = sortKeys.map(o => ({ value: o.value, label: ts(o.key) }));

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "random") params.delete("sortBy");
    else params.set("sortBy", value);
    router.push(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  const currentLabel = sortOptions.find((o) => o.value === current)?.label || ts('random');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          title={ts('sortLabel', { label: currentLabel })}
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