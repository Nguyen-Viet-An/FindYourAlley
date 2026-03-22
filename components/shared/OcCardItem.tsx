"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { OcCard } from "@/types";
import OcCardDetailModal from "./OcCardDetailModal";

type OcCardItemProps = {
  card: OcCard;
  tradeCount: { total: number; accepted: number };
  userId?: string;
  isOwner: boolean;
  alreadyRequested: boolean;
};

export default function OcCardItem({
  card,
  tradeCount,
  userId,
  isOwner,
  alreadyRequested,
}: OcCardItemProps) {
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const firstImage = card.images?.[0]?.imageUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="group block w-full text-left rounded-xl overflow-hidden border bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        {/* Image */}
        <div className="relative w-full">
          {firstImage && !imgError ? (
            <Image
              src={firstImage}
              alt={card.images?.[0]?.ocName || card.ownerName}
              width={400}
              height={500}
              className="w-full h-auto object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          {!card.available && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="text-xs">Hết card</Badge>
            </div>
          )}

          {card.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-0.5">
              {card.images.length} ảnh
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold truncate">{card.images?.[0]?.ocName || 'OC Card'}</h3>
          <p className="text-sm text-muted-foreground truncate mt-0.5">by {card.ownerName}</p>
          {card.images?.[0]?.artistName && (
            <p className="text-xs text-muted-foreground truncate">🎨 {card.images[0].artistName}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {tradeCount.total} muốn đổi
            </span>
            <Badge variant={card.available ? "default" : "secondary"} className="text-xs">
              {card.available ? "Còn đổi" : "Hết card"}
            </Badge>
          </div>
        </div>
      </button>

      <OcCardDetailModal
        card={card}
        tradeCount={tradeCount}
        userId={userId}
        isOwner={isOwner}
        alreadyRequested={alreadyRequested}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
