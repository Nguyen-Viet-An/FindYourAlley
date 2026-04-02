"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";

interface DayFilterProps {
  /** Festival start date (ISO string) */
  startDate: string;
  /** Festival end date (ISO string) */
  endDate: string;
}

function getDayCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function DayFilter({ startDate, endDate }: DayFilterProps) {
  const tc = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const dayCount = getDayCount(startDate, endDate);

  // Don't render for single-day festivals
  if (dayCount <= 1) return null;

  const selected = searchParams.get("festivalDay") || "";

  const onSelect = (day: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (day) {
      params.set("festivalDay", day);
    } else {
      params.delete("festivalDay");
    }
    params.delete("page");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Format the date label for each day
  const formatDayLabel = (dayNum: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (dayNum - 1));
    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    return tc('dayLabel', { day: dayNum, date: `${dd}/${mm}` });
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      <button
        onClick={() => onSelect("")}
        className={cn(
          "px-3 py-1 rounded-full text-sm font-medium transition-colors",
          !selected
            ? "bg-primary-500 text-white"
            : "bg-grey-50 dark:bg-muted text-grey-500 dark:text-muted-foreground hover:bg-grey-100 dark:hover:bg-muted/80"
        )}
      >
        {tc('allDays')}
      </button>
      {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
        <button
          key={day}
          onClick={() => onSelect(String(day))}
          className={cn(
            "px-3 py-1 rounded-full text-sm font-medium transition-colors",
            selected === String(day)
              ? "bg-primary-500 text-white"
              : "bg-grey-50 dark:bg-muted text-grey-500 dark:text-muted-foreground hover:bg-grey-100 dark:hover:bg-muted/80"
          )}
        >
          {formatDayLabel(day)}
        </button>
      ))}
    </div>
  );
}