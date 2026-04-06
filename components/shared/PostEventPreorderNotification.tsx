"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, ChevronDown, ChevronUp, Link as LinkIcon, Calendar } from "lucide-react";
import { getPostEventPreorderPromptEvents, togglePostEventPreorder } from "@/lib/actions/event.actions";
import { useTranslations } from 'next-intl';

type Props = {
  userId: string;
};

type EventFormData = {
  url: string;
  startDateTime: string;
  endDateTime: string;
};

export default function PostEventPreorderNotification({ userId }: Props) {
  const t = useTranslations('postEventPreorder');
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [prevUserId, setPrevUserId] = useState(userId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, EventFormData>>({});

  // Reset when user changes
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setChecked(false);
    setOpen(false);
  }

  useEffect(() => {
    if (!userId || checked) return;

    const sessionKey = `post_preorder_notif_seen_${userId}`;
    if (sessionStorage.getItem(sessionKey)) {
      setChecked(true);
      return;
    }

    (async () => {
      try {
        const eligibleEvents = await getPostEventPreorderPromptEvents(userId);
        setEvents(eligibleEvents || []);

        if (eligibleEvents && eligibleEvents.length > 0) {
          setOpen(true);
          // Initialize form data from existing event data
          const initial: Record<string, EventFormData> = {};
          for (const ev of eligibleEvents) {
            initial[ev._id] = {
              url: ev.url || '',
              startDateTime: ev.startDateTime ? new Date(ev.startDateTime).toISOString().slice(0, 16) : '',
              endDateTime: ev.endDateTime ? new Date(ev.endDateTime).toISOString().slice(0, 16) : '',
            };
          }
          setFormData(initial);
        }
      } catch (e) {
        console.error("Post-event preorder notification error:", e);
      } finally {
        sessionStorage.setItem(sessionKey, "1");
        setChecked(true);
      }
    })();
  }, [userId, checked]);

  const handleToggle = async (eventId: string, value: boolean) => {
    setProcessing(eventId);
    try {
      const data = value ? formData[eventId] : undefined;
      await togglePostEventPreorder(eventId, userId, value, data ? {
        url: data.url || undefined,
        startDateTime: data.startDateTime || undefined,
        endDateTime: data.endDateTime || undefined,
      } : undefined);
      setEvents(prev => prev.filter(e => e._id !== eventId));
      setExpandedId(prev => prev === eventId ? null : prev);
    } catch (e) {
      console.error("Error toggling post-event preorder:", e);
    } finally {
      setProcessing(null);
    }
  };

  const updateField = (eventId: string, field: keyof EventFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], [field]: value },
    }));
  };

  // Close dialog when all events are handled
  useEffect(() => {
    if (checked && events.length === 0 && open) {
      setOpen(false);
    }
  }, [events, checked, open]);

  if (!open || events.length === 0) return null;

  // Group events by festival
  const grouped: Record<string, any[]> = {};
  for (const event of events) {
    const key = event.festivalName || 'Festival';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(event);
  }
  const festivalNames = Object.keys(grouped);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-500" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto">
            {festivalNames.map((festName) => (
              <div key={festName} className="flex flex-col gap-2">
                <div>
                  <p className="text-sm font-semibold">{festName}</p>
                  <p className="text-xs text-muted-foreground">{t('description', { festival: festName })}</p>
                </div>
                {grouped[festName].map((event: any) => {
                  const isExpanded = expandedId === event._id;
                  const fd = formData[event._id] || { url: '', startDateTime: '', endDateTime: '' };
                  return (
                    <div key={event._id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{event.title}</span>
                          {event.hasPreorder === 'Yes' && (
                            <span className="text-xs text-green-600 dark:text-green-400">{t('hadPreorder')}</span>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => setExpandedId(isExpanded ? null : event._id)}
                            className="bg-primary-500 hover:bg-primary-400 text-white text-xs"
                          >
                            {t('yes')}
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggle(event._id, false)}
                            disabled={processing === event._id}
                            className="text-xs"
                          >
                            {t('no')}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3 pb-3 flex flex-col gap-2 border-t pt-2 bg-grey-50 dark:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Input
                              placeholder={t('linkPlaceholder')}
                              value={fd.url}
                              onChange={(e) => updateField(event._id, 'url', e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex gap-2 flex-1">
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground">{t('openDate')}</label>
                                <Input
                                  type="datetime-local"
                                  value={fd.startDateTime}
                                  onChange={(e) => updateField(event._id, 'startDateTime', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-muted-foreground">{t('closeDate')}</label>
                                <Input
                                  type="datetime-local"
                                  value={fd.endDateTime}
                                  onChange={(e) => updateField(event._id, 'endDateTime', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleToggle(event._id, true)}
                            disabled={processing === event._id}
                            className="bg-primary-500 hover:bg-primary-400 text-white text-sm w-full mt-1"
                          >
                            {processing === event._id ? '...' : t('confirm')}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('note')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
