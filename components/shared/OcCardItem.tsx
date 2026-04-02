"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { OcCard } from "@/types";
import OcCardDetailModal from "./OcCardDetailModal";
import DeleteOcCard from "./DeleteOcCard";
import { Pencil } from "lucide-react";
import { useTranslations } from 'next-intl';

type OcCardItemProps = {
  card: OcCard;
  imageIndex?: number;
  tradeCount: { total: number; accepted: number };
  userId?: string;
  isOwner: boolean;
  alreadyRequested: boolean;
  requestStatus?: "pending" | "accepted" | "declined" | null;
};

export default function OcCardItem({
  card,
  imageIndex = 0,
  tradeCount,
  userId,
  isOwner,
  alreadyRequested,
  requestStatus,
}: OcCardItemProps) {
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const t = useTranslations('ocCard');

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
          {isOwner && userId && (
            <div className="absolute right-2 top-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href={`/oc-cards/${card._id}/update`}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-card rounded-md p-1.5 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              <div onClick={(e) => e.stopPropagation()}>
                <DeleteOcCard cardId={card._id} userId={userId} iconOnly imageIndex={imageIndex} totalImages={card.images?.length} />
              </div>
            </div>
          )}
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
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <h3 className="text-white font-semibold text-sm line-clamp-1">
                {image?.ocName || 'OC Card'}
              </h3>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                card.available
                  ? 'bg-green-500/80 text-white'
                  : 'bg-red-500/80 text-white'
              }`}>
                {card.available ? t('available') : t('unavailable')}
              </span>
              {alreadyRequested && requestStatus && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  requestStatus === 'accepted'
                    ? 'bg-green-400/90 text-white'
                    : requestStatus === 'declined'
                      ? 'bg-gray-400/80 text-white'
                      : 'bg-yellow-400/80 text-white'
                }`}>
                  {requestStatus === 'accepted' ? t('accepted') : requestStatus === 'declined' ? t('rejected') : t('pending')}
                </span>
              )}
            </div>
            <p className="text-white/80 text-xs truncate">{card.ownerName}</p>
            {image?.artistName && (
              <p className="text-white/60 text-xs truncate">🎨 {image.artistName}</p>
            )}
            <p className="text-white/70 text-xs mt-1">
              {t('wantTrade', { count: tradeCount.total })}
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
        requestStatus={requestStatus}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}