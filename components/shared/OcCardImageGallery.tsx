"use client";

import Image from "next/image";
import CardLightbox from "./CardLightbox";
import type { OcCardImage } from "@/types";

type Props = {
  image?: OcCardImage;
  ownerName: string;
};

export default function OcCardImageGallery({ image, ownerName }: Props) {
  if (!image?.imageUrl) {
    return (
      <div className="w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-muted-foreground">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CardLightbox imageUrl={image.imageUrl} alt={image.ocName || ownerName}>
        <Image
          src={image.imageUrl}
          alt={image.ocName || ownerName}
          width={600}
          height={800}
          className="w-full h-auto object-contain rounded-xl border"
          unoptimized
        />
      </CardLightbox>
      {image.ocName && (
        <h4 className="font-semibold">{image.ocName}</h4>
      )}
      {image.artistName && (
        <p className="text-sm text-muted-foreground">🎨 Artist thực hiện: {image.artistName}</p>
      )}
      {image.description && (
        <p className="text-sm text-muted-foreground">{image.description}</p>
      )}
    </div>
  );
}