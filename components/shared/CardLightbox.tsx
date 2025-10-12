"use client";

import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { getLowResUrl } from '@/lib/utils';
import { X } from 'lucide-react';

type CardLightboxProps = {
  imageUrl: string;
  alt: string;
  onLoad?: () => void;
  renderImage?: boolean; // New prop to control image rendering
  children?: React.ReactNode;
};

export default function CardLightbox({ 
  imageUrl, 
  alt, 
  onLoad, 
  renderImage = true, // Default to true for backward compatibility
  children 
}: CardLightboxProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    document.body.style.overflow = ''; // Re-enable scrolling
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!imageRef.current) return;
    
    // Reduce zoom sensitivity
    const delta = e.deltaY * -0.001; // Reduced sensitivity
    const newZoom = Math.max(1, Math.min(5, zoomLevel + delta));
    
    if (newZoom === 1) {
      // Reset position when fully zoomed out
      setPosition({ x: 0, y: 0 });
    }
    
    setZoomLevel(newZoom);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    
    // Prevent default browser behavior that might cause selection
    e.preventDefault();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    // Change cursor style
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    // Prevent default browser behavior during drag
    e.preventDefault();
    
    // Calculate new position
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Apply the new position
    setPosition({ x: newX, y: newY });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault(); // Prevent any default behavior
    }
    
    setIsDragging(false);
    
    // Reset cursor style
    if (containerRef.current) {
      containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
    }
  };

  // Handle mouse leave to end dragging if mouse leaves the container
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.preventDefault();
      setIsDragging(false);
      
      // Reset cursor style
      if (containerRef.current) {
        containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
      }
    }
  };

  // Add global mouse up event handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        
        // Reset cursor style
        if (containerRef.current) {
          containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
        }
      }
    };
    
    // Add CSS to prevent text selection during dragging
    const addNoSelectCSS = () => {
      if (isDragging) {
        document.body.classList.add('no-select');
      } else {
        document.body.classList.remove('no-select');
      }
    };
    
    addNoSelectCSS(); // Apply immediately when isDragging changes
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.classList.remove('no-select'); // Clean up on unmount
    };
  }, [isDragging, zoomLevel]);

  // Add global style for no selection
  useEffect(() => {
    // Create a style element for the no-select class
    const style = document.createElement('style');
    style.innerHTML = `
      .no-select {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      .no-drag {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Determine aspect ratio of the container based on the aspect ratio of the image
  const aspectRatioStyle = {
    paddingBottom: '75%', // Default 4:3 aspect ratio
  };

  // Define image style with TypeScript-safe properties
  const imageStyle: CSSProperties = {
    transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
    transition: zoomLevel === 1 ? 'transform 0.3s ease-out' : 'none',
    maxWidth: '90vw',
    maxHeight: '90vh',
    pointerEvents: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none'
  };

  // Define container style with TypeScript-safe properties
  const containerStyle: CSSProperties = {
    cursor: zoomLevel > 1 ? 'grab' : 'zoom-in',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none'
  };

  return (
    <>
      <div 
        onClick={handleImageClick}
        className="cursor-zoom-in w-full overflow-hidden relative"
        style={aspectRatioStyle}
      >
        {renderImage && (
          <img 
            src={getLowResUrl(imageUrl)}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={onLoad}
          />
        )}
        {children}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full z-[1001] transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div 
            ref={containerRef}
            className="relative max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={containerStyle}
          >
            <div className="flex items-center justify-center h-full">
              <img 
                ref={imageRef}
                src={imageUrl}
                alt={alt}
                className="no-drag"
                style={imageStyle}
                draggable="false" // Prevent default drag behavior
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
