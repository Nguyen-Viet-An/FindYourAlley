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

const HasDealFilter = () => {
  const [selectedValue, setSelectedValue] = useState<string>("All");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const options = [
    { value: "All", label: "Bất kì" },
    { value: "Yes", label: "Có ưu đãi" },
  ];

  const onSelectValue = (value: string) => {
    setSelectedValue(value);
    setOpen(false);

    const currentParams = new URLSearchParams(searchParams.toString());

    if (value === "All") {
      currentParams.delete("hasDeal");
    } else {
      currentParams.set("hasDeal", "true");
    }
    currentParams.delete("page");
    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const currentValue = searchParams.get("hasDeal");
    setSelectedValue(currentValue === "true" ? "Yes" : "All");
  }, [searchParams]);

  const displayValue = options.find(option => option.value === selectedValue)?.label || "Bất kì";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            selectedValue === "Yes" && "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
          )}
        >
          <span className="flex items-center gap-1.5">
            {selectedValue === "Yes" && "🏷️"} {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelectValue(option.value)}
              className={cn(
                "flex w-full items-center px-3 py-2.5 text-sm hover:bg-accent transition-colors",
                selectedValue === option.value && "bg-accent font-medium"
              )}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedValue === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              {option.value === "Yes" && "🏷️ "}{option.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HasDealFilter;
