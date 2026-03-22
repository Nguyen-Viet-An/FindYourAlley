"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTradeRequest } from "@/lib/actions/tradeRequest.actions";
import { getOcCardsByUser } from "@/lib/actions/ocCard.actions";
import { Heart, Check } from "lucide-react";

type Props = {
  cardId: string;
  userId: string;
  imageIndex?: number;
  alreadyRequested: boolean;
  available: boolean;
};

export default function TradeRequestButton({
  cardId,
  userId,
  imageIndex = 0,
  alreadyRequested,
  available,
}: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [linkedCardId, setLinkedCardId] = useState("");
  const [myCards, setMyCards] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(alreadyRequested);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && !myCards.length) {
      getOcCardsByUser(userId).then(setMyCards).catch(() => {});
    }
  }, [open, userId, myCards.length]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createTradeRequest({
        cardId,
        userId,
        imageIndex,
        message: message.trim() || undefined,
        linkedCardId: linkedCardId || undefined,
      });
      setSubmitted(true);
      setOpen(false);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Button disabled className="w-full" variant="outline">
        <Check className="w-4 h-4 mr-2" /> Đã gửi yêu cầu đổi
      </Button>
    );
  }

  if (!available) {
    return (
      <Button disabled className="w-full" variant="secondary">
        Hết card
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">
          <Heart className="w-4 h-4 mr-2" /> Muốn đổi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gửi yêu cầu đổi card</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Lời nhắn (không bắt buộc)
            </label>
            <Textarea
              placeholder="VD: Mình muốn đổi card này, mình có card X..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {myCards.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Link card của bạn (không bắt buộc)
              </label>
              <select
                value={linkedCardId}
                onChange={(e) => setLinkedCardId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="">-- Không link --</option>
                {myCards.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.ownerName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
