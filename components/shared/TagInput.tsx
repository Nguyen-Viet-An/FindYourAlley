"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

export function TagInput({ value, onChange, placeholder, className }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !value.map(v => v.toLowerCase()).includes(normalized)) {
      onChange([...value, normalized]);
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 p-2 rounded-lg bg-grey-50 dark:bg-muted border border-gray-200 dark:border-border",
        className
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="px-3 py-1 text-sm rounded-full bg-primary-500 text-white flex items-center gap-2"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-white/70 hover:text-white transition-colors"
          >
            ×
          </button>
        </span>
      ))}

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}
