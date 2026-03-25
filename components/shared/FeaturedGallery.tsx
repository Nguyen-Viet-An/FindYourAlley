"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import CardLightbox from "./CardLightbox";

type FeaturedItem = {
  eventId: string;
  eventTitle: string;
  imageUrl: string;
  description: string;
  artists: string;
  dealBadge?: string;
};

export default function FeaturedGallery({ items }: { items: FeaturedItem[] }) {
  const [selected, setSelected] = useState<FeaturedItem | null>(null);
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close on click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setSelected(null);
  };

  if (!items.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Chưa có mặt hàng nổi bật nào. Các artist có thể thêm mặt hàng nổi bật khi đăng sample.
      </div>
    );
  }

  return (
    <>
      {/* Masonry Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 space-y-3">
        {items.map((item, i) => (
          <button
            key={`${item.eventId}-${i}`}
            onClick={() => setSelected(item)}
            className="block break-inside-avoid group relative overflow-hidden rounded-lg w-full text-left"
          >
            <img
              src={item.imageUrl || "/assets/images/broken-image.png"}
              alt={item.description || item.eventTitle}
              className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                loaded.has(i) ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              onLoad={() => setLoaded((prev) => new Set(prev).add(i))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-white text-sm font-semibold line-clamp-1">{item.eventTitle}</p>
              {item.artists && (
                <p className="text-white/80 text-xs line-clamp-1">{item.artists}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selected && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative bg-white dark:bg-card rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image (left) */}
            <div className="md:w-1/2 w-full flex-shrink-0 bg-black flex items-center justify-center">
              <CardLightbox imageUrl={selected.imageUrl || "/assets/images/broken-image.png"} alt={selected.description || selected.eventTitle} renderImage={false}>
                <img
                  src={selected.imageUrl || "/assets/images/broken-image.png"}
                  alt={selected.description || selected.eventTitle}
                  className="w-full h-full object-contain max-h-[60vh] md:max-h-[80vh] cursor-zoom-in"
                />
              </CardLightbox>
            </div>

            {/* Info (right) */}
            <div className="md:w-1/2 w-full p-6 flex flex-col gap-4 overflow-y-auto">
              <Link
                href={`/events/${selected.eventId}`}
                className="text-xl font-bold hover:text-primary-500 transition-colors"
              >
                {selected.eventTitle}
              </Link>

              {selected.artists && (
                <p className="text-muted-foreground text-sm">
                  Artists: {selected.artists}
                </p>
              )}

              {selected.description && (
                <div>
                  <p className="text-sm font-semibold mb-1">Mô tả mặt hàng</p>
                  <p className="text-foreground">{selected.description}</p>
                </div>
              )}

              {selected.dealBadge && (
                <span className="inline-block w-fit text-xs font-semibold bg-green-200 text-green-800 dark:bg-green-500/30 dark:text-green-300 px-2.5 py-1 rounded-full">
                  🏷️ {selected.dealBadge}
                </span>
              )}

              <Link
                href={`/events/${selected.eventId}`}
                className="mt-auto inline-block text-center bg-primary-500 hover:bg-primary-400 text-white rounded-full px-6 py-2.5 text-sm font-semibold transition"
              >
                Xem gian hàng →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}