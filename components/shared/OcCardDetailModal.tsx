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
import TradeRequestButton from "./TradeRequestButton";
import OcCardAvailabilityToggle from "./OcCardAvailabilityToggle";
import DeleteOcCard from "./DeleteOcCard";
import type { OcCard } from "@/types";

type Props = {
  card: OcCard;
  imageIndex?: number;
  tradeCount: { total: number; accepted: number };
  userId?: string;
  isOwner: boolean;
  alreadyRequested: boolean;
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
                <h2 className="text-xl font-bold">{image?.ocName || 'OC Card'}</h2>
                <p className="text-muted-foreground text-sm">Chủ: {card.ownerName}</p>
                {image?.artistName && (
                  <p className="text-xs text-muted-foreground">🎨 Artist: {image.artistName}</p>
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
            {!isOwner && userId && (
              <TradeRequestButton
                cardId={card._id}
                userId={userId}
                imageIndex={imageIndex}
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
