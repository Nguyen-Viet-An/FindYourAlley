"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, MapPin, User, MessageCircle, X } from "lucide-react";
import OcCardImageGallery from "./OcCardImageGallery";
import TradeRequestButton from "./TradeRequestButton";
import OcCardAvailabilityToggle from "./OcCardAvailabilityToggle";
import DeleteOcCard from "./DeleteOcCard";
import type { OcCard } from "@/types";

type Props = {
  card: OcCard;
  tradeCount: { total: number; accepted: number };
  userId?: string;
  isOwner: boolean;
  alreadyRequested: boolean;
  open: boolean;
  onClose: () => void;
};

export default function OcCardDetailModal({
  card,
  tradeCount,
  userId,
  isOwner,
  alreadyRequested,
  open,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Images */}
          <div className="p-4 bg-grey-50 dark:bg-gray-900">
            <OcCardImageGallery images={card.images} ownerName={card.ownerName} />
          </div>

          {/* Right: Info */}
          <div className="p-5 flex flex-col gap-3 overflow-y-auto max-h-[80vh]">
            {/* OC name + owner + actions */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{card.images?.[0]?.ocName || 'OC Card'}</h2>
                <p className="text-muted-foreground text-sm">Chủ: {card.ownerName}</p>
                {card.images?.[0]?.artistName && (
                  <p className="text-xs text-muted-foreground">🎨 Artist: {card.images[0].artistName}</p>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-1.5 shrink-0">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/oc-cards/${card._id}/update`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <DeleteOcCard cardId={card._id} userId={userId!} />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex gap-2 items-center flex-wrap">
              <Badge variant={card.available ? "default" : "destructive"} className="text-xs">
                {card.available ? "Còn đổi" : "Hết card"}
              </Badge>
              {card.festival?.map((f: any) => (
                <Badge key={f._id} variant="outline" className="text-xs">
                  {f.code || f.name}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">{tradeCount.total} muốn đổi</span>
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
                  <Image
                    src={card.appearance.imageUrl}
                    alt="Ảnh nhận dạng"
                    width={150}
                    height={150}
                    className="rounded-lg object-cover"
                  />
                )}
              </div>
            )}

            {/* Contact */}
            {card.contactMethod && (
              <div className="flex items-start gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                <p className="break-all">{card.contactMethod}</p>
              </div>
            )}

            {/* Trade request button (not for own cards) */}
            {!isOwner && userId && (
              <TradeRequestButton
                cardId={card._id}
                userId={userId}
                alreadyRequested={alreadyRequested}
                available={card.available}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
