"use client";

import React, { useState, useRef, useEffect } from 'react';

type CardLightboxProps = {
  imageUrl: string;
  alt: string;
  children?: React.ReactNode;
};

export default function CardLightbox({ imageUrl, alt, children }: CardLightboxProps) {
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
    const delta = e.deltaY * -0.002; // Reduced from -0.01 to -0.005
    const newZoom = Math.max(1, Math.min(5, zoomLevel + delta));
    
    if (newZoom === 1) {
      // Reset position when fully zoomed out
      setPosition({ x: 0, y: 0 });
    } else {
      // Calculate mouse position relative to image
      const rect = imageRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate where the mouse is on the image as a percentage
      const mouseXPercent = mouseX / rect.width;
      const mouseYPercent = mouseY / rect.height;
      
      // Calculate how much the position should change based on zoom change
      const zoomChange = newZoom - zoomLevel;
      
      // Adjust position to keep the mouse point fixed
      const newX = position.x - (zoomChange * mouseXPercent * rect.width);
      const newY = position.y - (zoomChange * mouseYPercent * rect.height);
      
      setPosition({ x: newX, y: newY });
    }
    
    setZoomLevel(newZoom);
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;
    
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
    
    // Calculate new position
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Apply the new position
    setPosition({ x: newX, y: newY });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Reset cursor style
    if (containerRef.current) {
      containerRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
    }
  };

  // Handle mouse leave to end dragging if mouse leaves the container
  const handleMouseLeave = () => {
    if (isDragging) {
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
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, zoomLevel]);

  // Determine aspect ratio of the container based on the aspect ratio of the image
  const aspectRatioStyle = {
    paddingBottom: '75%', // Default 4:3 aspect ratio
  };

  return (
    <>
      <div 
        onClick={handleImageClick}
        className="cursor-zoom-in w-full overflow-hidden relative"
        style={aspectRatioStyle}
      >
        <img 
          src={imageUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {children}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div 
            ref={containerRef}
            className="relative overflow-hidden max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: zoomLevel > 1 ? 'grab' : 'zoom-in' }}
          >
            <button 
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-white rounded-full p-2 text-black z-10"
            >
              ×
            </button>
            <div className="flex items-center justify-center h-full">
              <img 
                ref={imageRef}
                src={imageUrl}
                alt={alt}
                style={{ 
                  transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                  transition: zoomLevel === 1 ? 'transform 0.3s ease-out' : 'none',
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  pointerEvents: 'none' // Prevent image from receiving mouse events
                }}
              />
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-70 px-4 py-2 rounded-full">
              <span className="text-sm">Zoom: {Math.round(zoomLevel * 100)}% (scroll to zoom, drag to move)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}