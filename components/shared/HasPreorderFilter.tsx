"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const HasPreorderFilter = ({ festivalEndDate }: { festivalEndDate?: string | Date }) => {
  const tc = useTranslations('common');
  const tf = useTranslations('filter');
  const [selectedValue, setSelectedValue] = useState<string>("All");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if festival has ended
  const isFestivalEnded = festivalEndDate ? new Date(festivalEndDate) < new Date() : false;

  // Options change based on whether festival has ended
  const options = isFestivalEnded
    ? [
        { value: "All", label: tc('any') },
        { value: "PostEvent", label: tf('hasPostEventPreorder') },
        { value: "No", label: tc('no') }
      ]
    : [
        { value: "All", label: tc('any') },
        { value: "Yes", label: tf('hasPreorder') },
        { value: "No", label: tc('no') }
      ];

  // Handle selection change
  const onSelectValue = (value: string) => {
    setSelectedValue(value);
    setOpen(false);

    const currentParams = new URLSearchParams(searchParams.toString());

    if (value === "All") {
      currentParams.delete("hasPreorder");
      currentParams.delete("hasPostEventPreorder");
    } else if (value === "PostEvent") {
      currentParams.delete("hasPreorder");
      currentParams.set("hasPostEventPreorder", "true");
    } else {
      currentParams.set("hasPreorder", value === "Yes" ? "true" : "false");
      currentParams.delete("hasPostEventPreorder");
    }

    router.push(`?${currentParams.toString()}`, { scroll: false });
  };

  // Sync state with URL params
  useEffect(() => {
    const preorderValue = searchParams.get("hasPreorder");
    const postEventValue = searchParams.get("hasPostEventPreorder");
    if (postEventValue === "true") {
      setSelectedValue("PostEvent");
    } else if (preorderValue === "true") {
      setSelectedValue("Yes");
    } else if (preorderValue === "false") {
      setSelectedValue("No");
    } else {
      setSelectedValue("All");
    }
  }, [searchParams]);

  // Get display value for the button
  const displayValue = options.find(option => option.value === selectedValue)?.label || tc('any');

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