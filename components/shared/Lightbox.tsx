'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
  alt?: string;
}

const Lightbox: React.FC<LightboxProps> = ({ 
  imageUrl, 
  onClose,
  alt = 'Lightbox Image'
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Calculate initial scale to fit screen
  const calculateInitialScale = () => {
    if (!containerRef.current || !imageRef.current) return 1;

    const container = containerRef.current.getBoundingClientRect();
    const containerRatio = container.width / container.height;
    const imageRatio = imageDimensions.width / imageDimensions.height;

    if (imageRatio > containerRatio) {
      // Image is wider than container
      return container.width / imageDimensions.width;
    } else {
      // Image is taller than container
      return container.height / imageDimensions.height;
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prevZoom => {
      const newZoom = Math.min(Math.max(prevZoom + delta, 1), 4);
      return newZoom;
    });
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (zoom > 1) {
      setIsDragging(true);
      setStartPosition({ 
        x: e.clientX - position.x, 
        y: e.clientY - position.y 
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging && imageRef.current && containerRef.current) {
      const newX = e.clientX - startPosition.x;
      const newY = e.clientY - startPosition.y;

      // Calculate image and container dimensions
      const imgRect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Boundary checks
      const maxX = (imgRect.width - containerRect.width) / 2;
      const maxY = (imgRect.height - containerRect.height) / 2;

      setPosition({
        x: Math.min(Math.max(newX, -maxX), maxX),
        y: Math.min(Math.max(newY, -maxY), maxY)
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Reset zoom
  const handleResetZoom = () => {
    setZoom(calculateInitialScale());
    setPosition({ x: 0, y: 0 });
  };

  // Set initial zoom when image dimensions are loaded
  useEffect(() => {
    if (imageDimensions.width > 0) {
      const initialScale = calculateInitialScale();
      setZoom(initialScale);
    }
  }, [imageDimensions]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col items-center max-w-[90%] max-h-[90%] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-0 top-0 m-2 text-white hover:text-gray-300 z-10"
          aria-label="Close lightbox"
        >
          <X size={30} />
        </button>

        {/* Zoom Controls */}
        <div className="flex justify-center items-center mb-4 space-x-4">
          <button 
            onClick={() => setZoom(Math.max(1, zoom - 0.5))} 
            className="text-white hover:text-gray-300"
            disabled={zoom <= 1}
            aria-label="Zoom out"
          >
            <ZoomOut />
          </button>
          <span className="text-white">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(Math.min(4, zoom + 0.5))} 
            className="text-white hover:text-gray-300"
            disabled={zoom >= 4}
            aria-label="Zoom in"
          >
            <ZoomIn />
          </button>
          <button 
            onClick={handleResetZoom} 
            className="text-white hover:text-gray-300"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        </div>

        {/* Image Container */}
        <div 
          className="w-full h-full flex items-center justify-center overflow-hidden"
          style={{ 
            maxWidth: '90vw', 
            maxHeight: '80vh' 
          }}
        >
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt={alt}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="object-contain cursor-move"
            style={{
              transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
              transition: 'transform 0.3s ease',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Lightbox;