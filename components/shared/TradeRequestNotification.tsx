"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { getTradeRequestsForUser, getMyTradeRequests } from "@/lib/actions/tradeRequest.actions";
import { useTranslations } from 'next-intl';

type Props = {
  userId: string;
};

export default function TradeRequestNotification({ userId }: Props) {
  const t = useTranslations('tradeNotification');
  const tt = useTranslations('trade');
  const [open, setOpen] = useState(false);
  const [pendingIncoming, setPendingIncoming] = useState(0);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);
  const [prevUserId, setPrevUserId] = useState(userId);

  // Reset when user changes (e.g. switching Clerk accounts)
  if (userId !== prevUserId) {
    setPrevUserId(userId);
    setChecked(false);
    setOpen(false);
  }

  useEffect(() => {
    if (!userId || checked) return;

    const sessionKey = `trade_notif_seen_${userId}`;
    if (sessionStorage.getItem(sessionKey)) {
      setChecked(true);
      return;
    }

    (async () => {
      try {
        const [incoming, outgoing] = await Promise.all([
          getTradeRequestsForUser(userId),
          getMyTradeRequests(userId),
        ]);

        const pending = (incoming || []).filter((r: any) => r.status === "pending").length;
        const updates = (outgoing || []).filter(
          (r: any) => r.status === "accepted" || r.status === "declined"
        );

        setPendingIncoming(pending);
        setRecentUpdates(updates);

        if (pending > 0 || updates.length > 0) {
          setOpen(true);
        }
      } catch (e) {
        console.error("Trade notification error:", e);
      } finally {
        sessionStorage.setItem(sessionKey, "1");
        setChecked(true);
      }
    })();
  }, [userId, checked]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-500" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {pendingIncoming > 0 && (
            <div className="p-3 border rounded-lg">
              <p className="text-sm">
                {t('pendingMessage', { count: pendingIncoming })}
              </p>
            </div>
          )}
          {recentUpdates.length > 0 && (
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-semibold mb-2">{t('updateMessage')}</p>
              <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                {recentUpdates.map((req: any) => {
                  const cardImage = req.card?.images?.[req.imageIndex ?? 0];
                  const ocName = cardImage?.ocName || req.card?.ownerName || "OC Card";
                  return (
                    <div key={req._id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{ocName}</span>
                      {req.status === "accepted" ? (
                        <Badge className="bg-green-500 text-white text-xs shrink-0 ml-2">{tt('accepted')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs shrink-0 ml-2">{tt('rejected')}</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <Button asChild className="w-full">
            <Link href="/profile/trade-requests" onClick={() => setOpen(false)}>
              {t('viewAll')}
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}