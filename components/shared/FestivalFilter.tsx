"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FestivalFilterProps {
  festivals: { _id: string; name: string; code?: string }[];
}

export default function FestivalFilter({ festivals }: FestivalFilterProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const selectedFestivalId = searchParams.get('festivalId') || (festivals[0]?._id || '');

  const selectedFestival = festivals.find(f => f._id === selectedFestivalId);
  const displayValue = selectedFestival ? (selectedFestival.code || selectedFestival.name) : (festivals[0]?.code || festivals[0]?.name || '');

  const onSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('festivalId', id);
    params.delete('page');
    params.delete('festivalDay');
    setIsLoading(true);
    router.push(`?${params.toString()}`, { scroll: false });
    setTimeout(() => setIsLoading(false), 300);
    setOpen(false);
  };

  const filteredFestivals = useMemo(() => festivals, [festivals]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
            aria-expanded={open}
          className={cn('w-full justify-between min-w-0', isLoading ? 'opacity-70 cursor-not-allowed' : '')}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 min-w-0 w-full">
            <span className="block flex-1 min-w-0 max-w-full truncate text-left">{displayValue}</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-72 overflow-y-auto">
          {filteredFestivals.map(f => {
            const active = selectedFestivalId === f._id;
            return (
              <div
                key={f._id}
                className={cn(
                  'relative flex cursor-default select-none items-center gap-1 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  active ? 'bg-accent text-accent-foreground' : ''
                )}
                onClick={() => onSelect(f._id)}
              >
                <Check className={cn('h-4 w-4', active ? 'opacity-100' : 'opacity-0')} />
                <span>{f.code || f.name}</span>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
