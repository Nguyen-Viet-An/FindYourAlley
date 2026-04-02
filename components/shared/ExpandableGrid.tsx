"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type StatItem = { name: string; value: number; eventId?: string; eventTitle?: string };

export default function ExpandableGrid({
  items,
  initialCount = 8,
  countLabel,
}: {
  items: StatItem[];
  initialCount?: number;
  countLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("stats");
  const visible = expanded ? items : items.slice(0, initialCount);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((item) => (
          <Link
            key={item.name}
            href={item.eventId ? `/events/${item.eventId}` : "#"}
            className="p-3 rounded-lg border bg-white dark:bg-card hover:shadow transition flex flex-col"
          >
            <span className="font-medium">{item.name}</span>
            <span className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
              {countLabel.replace("{count}", String(item.value))}
            </span>
            {item.eventTitle && (
              <span className="text-[11px] text-gray-600 dark:text-muted-foreground mt-1 line-clamp-2">
                {item.eventTitle}
              </span>
            )}
          </Link>
        ))}
      </div>
      {items.length > initialCount && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-primary-500 hover:text-primary-400 font-medium transition-colors"
        >
          {expanded
            ? t("showLess")
            : t("showMore", { count: items.length - initialCount })}
        </button>
      )}
    </>
  );
}