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

const HasPreorderFilter = () => {
  const [selectedValue, setSelectedValue] = useState<string>("All");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Options for preorder filter
  const options = [
    { value: "All", label: "Bất kì" },
    { value: "Yes", label: "Có" },
    { value: "No", label: "Không" }
  ];

  // Handle selection change
  const onSelectValue = (value: string) => {
    setSelectedValue(value);
    setOpen(false);

    const currentParams = new URLSearchParams(searchParams.toString());

    if (value === "All") {
      currentParams.delete("hasPreorder");
    } else {
      currentParams.set("hasPreorder", value === "Yes" ? "true" : "false");
    }

    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sync state with URL params
  useEffect(() => {
    const currentValue = searchParams.get("hasPreorder");
    if (currentValue === "true") {
      setSelectedValue("Yes");
    } else if (currentValue === "false") {
      setSelectedValue("No");
    } else {
      setSelectedValue("All");
    }
  }, [searchParams]);

  // Get display value for the button
  const displayValue = options.find(option => option.value === selectedValue)?.label || "Bất kì";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-72 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                selectedValue === option.value ? "bg-accent text-accent-foreground" : ""
              )}
              onClick={() => onSelectValue(option.value)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  selectedValue === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HasPreorderFilter;