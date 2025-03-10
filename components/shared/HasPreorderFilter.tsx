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

const HasPreorderFilter = () => {
  const [selectedValue, setSelectedValue] = useState<string>("All");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle selection change
  const onSelectChange = (value: string) => {
    setSelectedValue(value);

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

  return (
    <Select value={selectedValue} onValueChange={onSelectChange}>
      <SelectTrigger className="select-field">
        <SelectValue placeholder="Select Preorder Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All</SelectItem>
        <SelectItem value="Yes">Yes</SelectItem>
        <SelectItem value="No">No</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default HasPreorderFilter;