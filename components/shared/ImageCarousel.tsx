'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CardLightbox from './CardLightbox'; // Adjust the import path as needed

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

  // Auto-advance slides
  useEffect(() => {
    if (displayImages.length <= 1) return;
    
    const slideInterval = setInterval(() => {
      nextSlide({ stopPropagation: () => {} } as React.MouseEvent);
    }, 5000);
    
    return () => clearInterval(slideInterval);
  }, [currentIndex, displayImages.length]);

  return (
    <div className="relative h-full w-full group" style={{ overflow: 'hidden' }}>
      {/* Loading state remains the same */}
      
      {/* Main image with lightbox */}
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <CardLightbox 
          imageUrl={displayImages[currentIndex]} 
          alt={`Event image ${currentIndex + 1}`}
          renderImage={false}
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
        </CardLightbox>
      </div>
  
      {/* Left Arrow */}
      {displayImages.length > 1 && (
        <>
          <div 
            className="hidden group-hover:block absolute top-1/2 left-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer z-40"
            onClick={prevSlide}
            style={{ transform: 'translateY(-50%)', pointerEvents: 'auto' }}
          >
            <ChevronLeft size={24} />
          </div>
          
          {/* Right Arrow */}
          <div 
            className="hidden group-hover:block absolute top-1/2 right-5 text-2xl rounded-full p-2 bg-black/20 text-white cursor-pointer z-40"
            onClick={nextSlide}
            style={{ transform: 'translateY(-50%)', pointerEvents: 'auto' }}
          >
            <ChevronRight size={24} />
          </div>
        </>
      )}
  
      {/* Dots navigation */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-40">
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
  );
};

export default ImageCarousel;