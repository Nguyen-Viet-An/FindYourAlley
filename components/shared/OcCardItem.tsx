"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { OcCard } from "@/types";
import OcCardDetailModal from "./OcCardDetailModal";

type OcCardItemProps = {
  card: OcCard;
  imageIndex?: number;
  tradeCount: { total: number; accepted: number };
  userId?: string;
  isOwner: boolean;
  alreadyRequested: boolean;
};

export default function OcCardItem({
  card,
  imageIndex = 0,
  tradeCount,
  userId,
  isOwner,
  alreadyRequested,
}: OcCardItemProps) {
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!card) return null;

  const image = card.images?.[imageIndex] || card.images?.[0];
  const imageUrl = image?.imageUrl;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="group block w-full text-left overflow-hidden rounded-2xl bg-white dark:bg-card shadow-md transition-all hover:shadow-lg cursor-pointer"
      >
        {/* Image with hover overlay */}
        <div className="relative w-full overflow-hidden">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={image?.ocName || card.ownerName}
              width={400}
              height={500}
              className="w-full h-auto object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}

          {/* Hover overlay with info */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-sm line-clamp-1">
                {image?.ocName || 'OC Card'}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                card.available
                  ? 'bg-green-500/80 text-white'
                  : 'bg-red-500/80 text-white'
              }`}>
                {card.available ? "Còn đổi" : "Hết card"}
              </span>
            </div>
            <p className="text-white/80 text-xs truncate">OC thuộc về {card.ownerName}</p>
            <p className="text-white/70 text-xs mt-1">
              {tradeCount.total} người muốn đổi
            </p>
          </div>
        </div>
      </button>

      <OcCardDetailModal
        card={card}
        imageIndex={imageIndex}
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
