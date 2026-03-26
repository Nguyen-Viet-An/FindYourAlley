"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTradeRequest, getDefaultContact } from "@/lib/actions/tradeRequest.actions";
import { getOcCardsByUser } from "@/lib/actions/ocCard.actions";
import { Heart, Check } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  cardId: string;
  userId: string | null;
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [contactLoaded, setContactLoaded] = useState(false);
  const [linkedCardId, setLinkedCardId] = useState("");
  const [myCards, setMyCards] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(alreadyRequested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && userId && !myCards.length) {
      getOcCardsByUser(userId).then(setMyCards).catch(() => {});
    }
    if (open && userId && !contactLoaded) {
      getDefaultContact(userId).then((c) => {
        setContactMethod(c || "");
        setContactLoaded(true);
      }).catch(() => setContactLoaded(true));
    }
  }, [open, userId, myCards.length, contactLoaded]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await createTradeRequest({
        cardId,
        userId: userId!,
        imageIndex,
        message: message.trim() || undefined,
        contactMethod: contactMethod.trim() || undefined,
        linkedCardId: linkedCardId ? linkedCardId.split("-")[0] : undefined,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setOpen(false);
      }
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  // One tile per image, selection key includes imageIndex for uniqueness
  const myCardItems: { card: any; imgIndex: number; imageUrl: string; ocName: string }[] = [];
  myCards.forEach((card: any) => {
    if (card.images && card.images.length > 0) {
      card.images.forEach((img: any, ii: number) => {
        if (img?.imageUrl) {
          myCardItems.push({
            card,
            imgIndex: ii,
            imageUrl: img.imageUrl,
            ocName: img.ocName || card.ownerName,
          });
        }
      });
    }
  });

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

  if (!userId) {
    return (
      <Button
        className="w-full bg-pink-500 hover:bg-pink-600 text-white"
        onClick={() => router.push("/sign-in")}
      >
        <Heart className="w-4 h-4 mr-2" /> Muốn đổi
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gửi yêu cầu đổi card</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Card picker */}
          {myCardItems.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Chọn card của bạn để đổi (không bắt buộc)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                {myCardItems.map((item) => {
                  const key = `${item.card._id}-${item.imgIndex}`;
                  const isSelected = linkedCardId === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setLinkedCardId(isSelected ? "" : key)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-pink-500 ring-2 ring-pink-300"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.ocName}
                        width={100}
                        height={130}
                        className="w-full h-auto object-cover"
                        unoptimized
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                        <p className="text-white text-[10px] truncate">{item.ocName}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-pink-500 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact method - required */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Phương thức liên lạc (không bắt buộc)
            </label>
            <input
              type="text"
              placeholder="VD: FB: facebook.com/ten, IG: @ten, Discord: ten#1234..."
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              maxLength={300}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Để chủ card có thể liên hệ bạn khi chấp nhận đổi</p>
          </div>

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

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg p-3">{error}</p>
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