"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
  };

  // Auto-advance slides (only when not in lightbox mode)
  useEffect(() => {
    if (displayImages.length <= 1 || lightboxOpen) return;

    const slideInterval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const isLastSlide = prevIndex === displayImages.length - 1;
        return isLastSlide ? 0 : prevIndex + 1;
      });
    }, 5000);

    return () => clearInterval(slideInterval);
  }, [currentIndex, displayImages.length, lightboxOpen]);

  return (
    <>
      {/* Main carousel */}
      <div className="relative h-full w-full group" style={{ overflow: 'hidden' }}>
        {/* Main image with lightbox */}
        <div 
          style={{ width: '100%', height: '100%', position: 'relative' }}
          onClick={openLightbox}
          className="cursor-pointer"
        >
          <div className="absolute inset-0" style={{ zIndex: 1 }}>
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
        </div>

        {/* Left Arrow */}
        {displayImages.length > 1 && (
          <div
            className="absolute top-1/2 left-0 transform -translate-y-1/2 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer z-50 hover:bg-black/40 transition-colors"
            onClick={prevSlide}
            style={{ left: '10px' }}
          >
            <ChevronLeft size={24} />
          </div>
        )}

        {/* Right Arrow */}
        {displayImages.length > 1 && (
          <div
            className="absolute top-1/2 right-0 transform -translate-y-1/2 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer z-50 hover:bg-black/40 transition-colors"
            onClick={nextSlide}
            style={{ right: '10px' }}
          >
            <ChevronRight size={24} />
          </div>
        )}

        {/* Dots navigation */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-50">
            <div className="flex items-center justify-center gap-2">
              {displayImages.map((_, slideIndex) => (
                <div
                  key={slideIndex}
                  onClick={(e) => goToSlide(slideIndex, e)}
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
            className="relative w-full h-full flex items-center justify-center" 
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[currentIndex]}
              alt={`Lightbox image ${currentIndex + 1}`}
              fill
              className="object-contain p-12"
              unoptimized
            />
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
                    onClick={(e) => goToSlide(slideIndex, e)}
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