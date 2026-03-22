"use client";

import Image from "next/image";
import { useState } from "react";
import type { OcCardImage } from "@/types";

type Props = {
  images: OcCardImage[];
  ownerName: string;
};

export default function OcCardImageGallery({ images, ownerName }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const current = images[selectedIndex];

  if (!images.length) {
    return (
      <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full rounded-xl overflow-hidden border">
        <Image
          src={current.imageUrl}
          alt={current.ocName || `${ownerName} - card ${selectedIndex + 1}`}
          width={600}
          height={800}
          className="w-full h-auto object-contain"
        />
      </div>
      {current.ocName && (
        <h4 className="font-semibold">{current.ocName}</h4>
      )}
      {current.artistName && (
        <p className="text-sm text-muted-foreground">🎨 {current.artistName}</p>
      )}
      {current.description && (
        <p className="text-sm text-muted-foreground">{current.description}</p>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                i === selectedIndex ? "border-primary-500" : "border-transparent"
              }`}
            >
              <Image
                src={img.imageUrl}
                alt={`Thumbnail ${i + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
