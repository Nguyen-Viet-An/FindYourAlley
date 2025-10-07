"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  className?: string;        // optional container class override
  height?: string | number;  // explicit height (e.g., '560px' or tailwind arbitrary not needed if using className)
  arrowOffset?: number;      // new optional prop for fine-tuning arrow horizontal inset
}

const ImageCarousel = ({ images, className, height, arrowOffset = 4 }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (!lightboxOpen) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0015; // sensitivity
    setZoom((prev: number) => clamp(prev + delta, 1, 5));
    // Reset pan when fully zoomed out
    if (zoom + delta <= 1.05) setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset({ x: newX, y: newY });
  };

  const endDrag = () => setIsDragging(false);

  // Ensure we have at least one image
  const displayImages = images.length > 0 ? images : ['/assets/images/broken-image.png'];

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the lightbox when clicking navigation
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? displayImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the lightbox when clicking navigation
    const isLastSlide = currentIndex === displayImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the lightbox when clicking dots
    setCurrentIndex(slideIndex);
  };

  const openLightbox = () => {
    setLightboxOpen(true);
    // Prevent scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOpen(false);
    // Restore scrolling
    document.body.style.overflow = 'auto';
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Auto-advance slides (only when not in lightbox mode)
  useEffect(() => {
    if (displayImages.length <= 1 || lightboxOpen) return;

    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex: number) => {
        const isLastSlide = prevIndex === displayImages.length - 1;
        return isLastSlide ? 0 : prevIndex + 1;
      });
    }, 5000);

    return () => clearInterval(slideInterval);
  }, [currentIndex, displayImages.length, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [lightboxOpen]);

  return (
    <>
      {/* Main carousel */}
      <div
        className={`relative w-full select-none ${className ? className : 'h-[420px] md:h-[520px]'} group`}
        style={height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined}
      >
        {/* Main image with lightbox */}
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={openLightbox}
        >
          <Image
            src={displayImages[currentIndex]}
            alt={`Event image ${currentIndex + 1}`}
            fill
            priority
            className="object-contain object-center transition-opacity duration-500"
            onLoad={() => setIsLoading(false)}
            unoptimized
          />
        </div>

        {/* Left Arrow */}
        {displayImages.length > 1 && (
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 text-2xl rounded-full p-1.5 md:p-2 bg-black/25 text-white cursor-pointer z-50 hover:bg-black/40 transition-colors"
            onClick={prevSlide}
            style={{ left: `${arrowOffset}px` }}
          >
            <ChevronLeft size={22} />
          </div>
        )}

        {/* Right Arrow */}
        {displayImages.length > 1 && (
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 text-2xl rounded-full p-1.5 md:p-2 bg-black/25 text-white cursor-pointer z-50 hover:bg-black/40 transition-colors"
            onClick={nextSlide}
            style={{ right: `${arrowOffset}px` }}
          >
            <ChevronRight size={22} />
          </div>
        )}

        {/* Dots navigation */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-50">
            <div className="flex items-center justify-center gap-2">
              {displayImages.map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  onClick={(e: React.MouseEvent) => goToSlide(slideIndex, e)}
                  className={`transition-all w-3 h-3 rounded-full cursor-pointer ${
                    currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox implementation */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center"
          onClick={closeLightbox}
          onWheel={handleWheelZoom}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full z-[1001] transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Lightbox image */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-zoom-in"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={endDrag}
            onMouseUp={endDrag}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <Image
              src={displayImages[currentIndex]}
              alt={`Lightbox image ${currentIndex + 1}`}
              fill
              className="object-contain select-none"
              unoptimized
              draggable={false}
              onClick={(e: React.MouseEvent) => e.stopPropagation()} // clicking image itself keeps lightbox open
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
            />
            {zoom > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs bg-black/40 px-2 py-1 rounded">
                Zoom: {zoom.toFixed(2)}x (Cuộn để phóng to / thu nhỏ)
              </div>
            )}
          </div>

          {/* Lightbox Left Arrow - positioned differently from the main carousel */}
          {displayImages.length > 1 && (
            <button
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full z-[1001] transition-colors"
              onClick={prevSlide}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Lightbox Right Arrow - positioned differently from the main carousel */}
          {displayImages.length > 1 && (
            <button
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full z-[1001] transition-colors"
              onClick={nextSlide}
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Lightbox Dots - positioned differently from the main carousel */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 z-[1001]">
              <div className="flex items-center justify-center gap-3">
                {displayImages.map((_, slideIndex) => (
                  <button
                    key={slideIndex}
                    onClick={(e: React.MouseEvent) => goToSlide(slideIndex, e)}
                    className={`transition-all w-4 h-4 rounded-full ${
                      currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to slide ${slideIndex + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImageCarousel;