'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure we have at least one image
  const displayImages = images.length > 0 ? images : ['/assets/images/default-event-image.png'];

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? displayImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === displayImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  // Auto-advance slides
  useEffect(() => {
    if (displayImages.length <= 1) return;
    
    const slideInterval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(slideInterval);
  }, [currentIndex, displayImages.length]);

  return (
    <div className="relative h-full w-full group">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}
      
      {/* Main image */}
      <Image
        src={displayImages[currentIndex]}
        alt={`Event image ${currentIndex + 1}`}
        fill
        priority
        className="object-cover object-center transition-opacity duration-500"
        onLoad={() => setIsLoading(false)} // Use onLoad instead of onLoadingComplete
        unoptimized 
        />

      {/* Left Arrow */}
      {displayImages.length > 1 && (
        <>
          <div 
            className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer"
            onClick={prevSlide}
          >
            <ChevronLeft size={24} />
          </div>
          
          {/* Right Arrow */}
          <div 
            className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer"
            onClick={nextSlide}
          >
            <ChevronRight size={24} />
          </div>
        </>
      )}

      {/* Dots navigation */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0">
          <div className="flex items-center justify-center gap-2">
            {displayImages.map((_, slideIndex) => (
              <div
                key={slideIndex}
                onClick={() => goToSlide(slideIndex)}
                className={`transition-all w-3 h-3 rounded-full cursor-pointer ${
                  currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;