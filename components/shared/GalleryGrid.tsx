"use client";

import Link from "next/link";
import { useState } from "react";

type GalleryImage = {
  imageUrl: string;
  eventId: string;
  title: string;
  artists: string;
  index: number;
};

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [loaded, setLoaded] = useState<Set<number>>(new Set());

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
      {images.map((img, i) => (
        <Link
          key={`${img.eventId}-${img.index}-${i}`}
          href={`/events/${img.eventId}`}
          className="block break-inside-avoid group relative overflow-hidden rounded-lg"
        >
          <img
            src={img.imageUrl || "/assets/images/broken-image.png"}
            alt={img.title}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              loaded.has(i) ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setLoaded((prev) => new Set(prev).add(i))}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <p className="text-white text-sm font-semibold line-clamp-1">{img.title}</p>
            {img.artists && (
              <p className="text-white/80 text-xs line-clamp-1">{img.artists}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
