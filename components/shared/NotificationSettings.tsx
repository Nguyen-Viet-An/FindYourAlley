"use client";

import { useEffect, useState, useTransition, useRef, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, BellOff, Loader2, X, Search } from "lucide-react";
import { getNotificationSub, upsertNotificationSub, deleteNotificationSub } from "@/lib/actions/notification.actions";
import { getAllCategories } from "@/lib/actions/category.actions";
import { ICategory } from "@/lib/database/models/category.model";

function SearchableSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: ICategory[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const tc = useTranslations('common');
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(
    () => options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  const toggle = (name: string) => {
    onChange(
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
    );
  };

  return (
    <div ref={ref} className="relative">
      <p className="text-sm font-semibold mb-1.5">{label}</p>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 bg-primary-500 text-white"
            >
              {name}
              <button onClick={() => toggle(name)} className="hover:bg-white/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          className="w-full h-9 rounded-md border bg-transparent pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary-500"
          placeholder={tc('searchAndSelect')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">{tc('notFound')}</div>
          )}
          {filtered.map((cat) => {
            const isSelected = selected.includes(cat.name);
            return (
              <button
                key={cat._id}
                onClick={() => { toggle(cat.name); setQuery(""); }}
                className={`flex w-full items-center px-3 py-2 text-sm hover:bg-accent transition ${
                  isSelected ? "bg-primary-50 dark:bg-primary-500/10 font-medium" : ""
                }`}
              >
                <span className={`mr-2 h-4 w-4 flex items-center justify-center rounded border text-xs ${
                  isSelected ? "bg-primary-500 border-primary-500 text-white" : "border-border"
                }`}>
                  {isSelected && "✓"}
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function NotificationSettings({ userId }: { userId: string }) {
  const t = useTranslations('notification');
  const tc = useTranslations('common');
  const [email, setEmail] = useState("");
  const [fandoms, setFandoms] = useState<string[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [allFandoms, setAllFandoms] = useState<ICategory[]>([]);
  const [allItemTypes, setAllItemTypes] = useState<ICategory[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const [sub, fandomCats, itemTypeCats] = await Promise.all([
        getNotificationSub(userId),
        getAllCategories("fandom"),
        getAllCategories("itemType"),
      ]);
      if (sub) {
        setEmail(sub.email);
        setFandoms(sub.fandoms || []);
        setItemTypes(sub.itemTypes || []);
        setActive(sub.active);
      }
      setAllFandoms(Array.isArray(fandomCats) ? fandomCats : []);
      setAllItemTypes(Array.isArray(itemTypeCats) ? itemTypeCats : []);
      setLoaded(true);
    };
    load();
  }, [userId]);

  const handleSave = () => {
    if (!email.trim()) { setMessage(t('emailRequired')); return; }
    startTransition(async () => {
      await upsertNotificationSub({ userId, email, fandoms, itemTypes, active: true });
      setActive(true);
      setMessage(t('savedSuccess'));
      setTimeout(() => setMessage(""), 3000);
    });
  };

  const handleDisable = () => {
    startTransition(async () => {
      await deleteNotificationSub(userId);
      setActive(false);
      setFandoms([]);
      setItemTypes([]);
      setMessage(t('disabledSuccess'));
      setTimeout(() => setMessage(""), 3000);
    });
  };

  if (!loaded) return <div className="p-4 text-muted-foreground">{tc('loading')}</div>;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        {active ? <Bell className="h-5 w-5 text-primary-500" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
        <h3 className="text-lg font-bold">{t('title')}</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('description')}
      </p>

      <div>
        <label className="text-sm font-semibold">{t('emailLabel')}</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label={t('fandomLabel')}
          options={allFandoms}
          selected={fandoms}
          onChange={setFandoms}
        />
        <SearchableSelect
          label={t('itemTypeLabel')}
          options={allItemTypes}
          selected={itemTypes}
          onChange={setItemTypes}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isPending} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {active ? tc('update') : t('enable')}
        </Button>
        {active && (
          <Button variant="outline" onClick={handleDisable} disabled={isPending}>
            {t('disable')}
          </Button>
        )}
      </div>
      {message && <p className="text-sm text-primary-500">{message}</p>}
    </div>
  );
}