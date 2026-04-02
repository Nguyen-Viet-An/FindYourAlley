"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { getPostEventPreorderPromptEvents, togglePostEventPreorder } from "@/lib/actions/event.actions";
import { useTranslations } from 'next-intl';

type Props = {
  userId: string;
};

export default function PostEventPreorderNotification({ userId }: Props) {
  const t = useTranslations('postEventPreorder');
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [prevUserId, setPrevUserId] = useState(userId);

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
      await togglePostEventPreorder(eventId, userId, value);
      setEvents(prev => prev.filter(e => e._id !== eventId));
    } catch (e) {
      console.error("Error toggling post-event preorder:", e);
    } finally {
      setProcessing(null);
    }
  };

  // Close dialog when all events are handled
  useEffect(() => {
    if (checked && events.length === 0 && open) {
      setOpen(false);
    }
  }, [events, checked, open]);

  if (!open || events.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-500" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {t('description', { festival: events[0]?.festivalName || 'Festival' })}
          </p>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {events.map((event: any) => (
              <div key={event._id} className="flex items-center justify-between p-3 border rounded-lg gap-2">
                <span className="text-sm font-medium truncate flex-1">{event.title}</span>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleToggle(event._id, true)}
                    disabled={processing === event._id}
                    className="bg-primary-500 hover:bg-primary-400 text-white text-xs"
                  >
                    {t('yes')}
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
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t('note')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
