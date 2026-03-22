"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/utils";

type Suggestion = { type: "booth" | "artist" | "tag"; value: string };

export default function SearchAutocomplete({
  placeholder = "Tìm theo tên gian/artist/couple...",
  suggestions = [],
}: {
  placeholder?: string;
  suggestions?: Suggestion[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsClient(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.length >= 1
    ? suggestions.filter((s) => s.value.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const navigate = useCallback(
    (value: string) => {
      setQuery(value);
      setOpen(false);
      const newUrl = value.trim().length >= 2
        ? formUrlQuery({ params: searchParams.toString(), key: "query", value })
        : removeKeysFromQuery({ params: searchParams.toString(), keysToRemove: ["query"] });
      router.push(newUrl, { scroll: false });
    },
    [searchParams, router]
  );

  // Debounce search
  useEffect(() => {
    if (!isClient) return;
    const timer = setTimeout(() => {
      const newUrl = query.trim().length >= 2
        ? formUrlQuery({ params: searchParams.toString(), key: "query", value: query })
        : removeKeysFromQuery({ params: searchParams.toString(), keysToRemove: ["query"] });
      router.push(newUrl, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchParams, router, isClient]);

  if (!isClient) return null;

  const typeLabel = (t: string) =>
    t === "booth" ? "Gian" : t === "artist" ? "Artist" : "Tag";

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="flex-center min-h-[54px] w-full overflow-hidden rounded-full bg-grey-50 dark:bg-muted px-4 py-2">
        <Image src="/assets/icons/search.svg" alt="search" width={24} height={24} className="dark:invert" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (filtered.length) setOpen(true); }}
          className="p-regular-16 border-0 bg-grey-50 dark:bg-muted outline-offset-0 placeholder:text-grey-500 dark:placeholder:text-muted-foreground focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-y-auto">
          {filtered.map((s, i) => (
            <button
              key={`${s.type}-${s.value}-${i}`}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => navigate(s.value)}
            >
              <span className="text-xs text-muted-foreground min-w-[40px]">{typeLabel(s.type)}</span>
              <span>{s.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
