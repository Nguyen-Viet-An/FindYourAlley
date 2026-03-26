"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, User } from "lucide-react";
import OcCardImageGallery from "./OcCardImageGallery";
import CardLightbox from "./CardLightbox";
import ShareButton from "./ShareButton";
import TradeRequestButton from "./TradeRequestButton";
import TradeRequestAction from "./TradeRequestAction";
import OcCardAvailabilityToggle from "./OcCardAvailabilityToggle";
import DeleteOcCard from "./DeleteOcCard";
import { getTradeRequestsForCard } from "@/lib/actions/tradeRequest.actions";
import type { OcCard } from "@/types";

type Props = {
  card: OcCard;
  imageIndex?: number;
  tradeCount: { total: number; accepted: number };
  userId?: string;
  isOwner: boolean;
  alreadyRequested: boolean;
  requestStatus?: "pending" | "accepted" | "declined" | null;
  open: boolean;
  onClose: () => void;
};

export default function OcCardDetailModal({
  card,
  imageIndex = 0,
  tradeCount,
  userId,
  isOwner,
  alreadyRequested,
  requestStatus,
  open,
  onClose,
}: Props) {
  const image = card.images?.[imageIndex] || card.images?.[0];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Image */}
          <div className="p-4 bg-grey-50 dark:bg-gray-900">
            <OcCardImageGallery image={image} ownerName={card.ownerName} />
          </div>

          {/* Right: Info */}
          <div className="p-5 flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
            {/* OC name + owner + actions */}
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/oc-cards/${card._id}`} className="text-xl font-bold hover:text-primary-500 transition-colors">
                  {image?.ocName || 'OC Card'}
                </Link>
                <p className="text-muted-foreground text-sm">OC thuộc về {card.ownerName}</p>
                {/* {image?.artistName && (
                  <p className="text-xs text-muted-foreground">Artist: {image.artistName}</p>
                )} */}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <ShareButton title={image?.ocName || card.ownerName} />
                {isOwner && (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/oc-cards/${card._id}/update`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <DeleteOcCard cardId={card._id} userId={userId!} imageIndex={imageIndex} totalImages={card.images?.length} />
                  </>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex gap-2 items-center flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                card.available
                  ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
              }`}>
                {card.available ? "Còn đổi" : "Hết card"}
              </span>
              {card.festival?.map((f: any) => (
                <Badge key={f._id} variant="outline" className="text-xs">
                  {f.code || f.name}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">{tradeCount.total} người muốn đổi</span>
              {/* Requester's request status */}
              {!isOwner && alreadyRequested && requestStatus === "accepted" && (
                <Badge className="bg-green-500 text-white text-xs">Đã chấp nhận</Badge>
              )}
              {!isOwner && alreadyRequested && requestStatus === "declined" && (
                <Badge variant="secondary" className="text-xs">Đã từ chối</Badge>
              )}
              {!isOwner && alreadyRequested && requestStatus === "pending" && (
                <Badge variant="outline" className="text-xs">Đang chờ</Badge>
              )}
              {isOwner && (
                <OcCardAvailabilityToggle cardId={card._id} userId={userId!} initialAvailable={card.available} />
              )}
            </div>

            {/* Time & Location */}
            {(card.eventTime || card.location) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <p>
                  {card.eventTime}
                  {card.eventTime && card.location && " \u2022 "}
                  {card.location}
                </p>
              </div>
            )}

            {/* Appearance */}
            {(card.appearance?.text || card.appearance?.imageUrl) && (
              <div className="border rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Đặc điểm nhận dạng
                </h4>
                {card.appearance?.text && <p className="text-sm mb-1.5">{card.appearance.text}</p>}
                {card.appearance?.imageUrl && (
                  <CardLightbox imageUrl={card.appearance.imageUrl} alt="Ảnh nhận dạng" renderImage={false}>
                    <Image
                      src={card.appearance.imageUrl}
                      alt="Ảnh nhận dạng"
                      width={150}
                      height={150}
                      className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      unoptimized
                    />
                  </CardLightbox>
                )}
              </div>
            )}

            {/* Contact */}
            {card.contactMethod && (
              <div className="text-sm">
                <p className="font-semibold mb-1">Phương thức liên lạc</p>
                <p className="break-all text-muted-foreground">{card.contactMethod}</p>
              </div>
            )}

            {/* Trade request button (not for own cards) */}
            {!isOwner && (
              <div className="pt-2">
                <TradeRequestButton
                  cardId={card._id}
                  userId={userId || null}
                  imageIndex={imageIndex}
                  alreadyRequested={alreadyRequested}
                  available={card.available}
                />
              </div>
            )}

            {/* Trade requests list (owner only) */}
            {isOwner && userId && (
              <OwnerTradeRequests cardId={card._id} userId={userId} open={open} imageIndex={imageIndex} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OwnerTradeRequests({ cardId, userId, open, imageIndex }: { cardId: string; userId: string; open: boolean; imageIndex: number }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getTradeRequestsForCard(cardId, imageIndex)
        .then((data) => setRequests(data || []))
        .catch(() => setRequests([]))
        .finally(() => setLoading(false));
    }
  }, [open, cardId, imageIndex]);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Đang tải...</p>;
  }

  if (!requests.length) {
    return (
      <div className="border rounded-lg p-3 text-xs text-muted-foreground">
        Chưa có ai muốn đổi card này.
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3">
      <h4 className="font-semibold text-sm mb-2">Danh sách muốn đổi ({requests.length})</h4>
      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
        {requests.map((req: any) => {
          const name = req.requester
            ? `${req.requester.firstName || ""} ${req.requester.lastName || ""}`.trim()
            : "Unknown";
          return (
            <div key={req._id} className="flex flex-col gap-1 p-2 border rounded-md bg-grey-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{name}</span>
                <TradeRequestAction requestId={req._id} userId={userId} status={req.status} />
              </div>
              {req.message && (
                <p className="text-xs text-muted-foreground">{req.message}</p>
              )}
              {req.contactMethod && (
                <p className="text-xs text-muted-foreground">Phương thức liên lạc: <span className="font-medium text-foreground">{req.contactMethod}</span></p>
              )}
              {req.linkedCard && (
                <Link
                  href={`/oc-cards/${req.linkedCard._id}`}
                  className="flex items-center gap-2 mt-1 p-1.5 rounded-md bg-white dark:bg-gray-700 border hover:border-primary-500 transition-colors"
                >
                  {req.linkedCard.images?.[0]?.imageUrl && (
                    <Image
                      src={req.linkedCard.images[0].imageUrl}
                      alt={req.linkedCard.images[0]?.ocName || req.linkedCard.ownerName}
                      width={40}
                      height={52}
                      className="rounded object-cover w-[40px] h-[52px] shrink-0"
                      unoptimized
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {req.linkedCard.images?.[0]?.ocName || req.linkedCard.ownerName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Card đề xuất đổi</p>
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}