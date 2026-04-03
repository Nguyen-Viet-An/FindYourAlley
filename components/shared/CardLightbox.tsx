"use client";

import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { getLowResUrl } from '@/lib/utils';
import { X } from 'lucide-react';

type CardLightboxProps = {
  imageUrl: string;
  alt: string;
  onLoad?: () => void;
  renderImage?: boolean;
  children?: React.ReactNode;
};

export default function CardLightbox({
  imageUrl,
  alt,
  onLoad,
  renderImage = true,
  children
}: CardLightboxProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const zoomRef = useRef(zoomLevel);
  const positionRef = useRef(position);
  useEffect(() => { zoomRef.current = zoomLevel; }, [zoomLevel]);
  useEffect(() => { positionRef.current = position; }, [position]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsLightboxOpen(true);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Clamp position so the image cannot be dragged fully off-screen.
  // Keeps at least 25% of the scaled image visible on each axis.
  const clampPosition = useCallback((x: number, y: number, zoom: number) => {
    const img = imageRef.current;
    if (!img || zoom <= 1) return { x: 0, y: 0 };

    const rect = img.getBoundingClientRect();
    // Natural size of the img element (before CSS transform scale)
    const naturalW = rect.width / zoom;
    const naturalH = rect.height / zoom;
    const scaledW = naturalW * zoom;
    const scaledH = naturalH * zoom;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Allow panning so that the edge of the image can reach the center of viewport
    const maxX = (scaledW - naturalW) / 2;
    const maxY = (scaledH - naturalH) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  // Wheel zoom (capture phase to bypass react-remove-scroll inside Radix Dialog)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleWheel = (e: WheelEvent) => {
      if (!overlayRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY * -0.001;
      const newZoom = Math.max(1, Math.min(5, zoomRef.current + delta));

      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        // Re-clamp position at new zoom level
        const clamped = clampPosition(positionRef.current.x, positionRef.current.y, newZoom);
        setPosition(clamped);
      }
      setZoomLevel(newZoom);
    };

    document.addEventListener('wheel', handleWheel, { capture: true, passive: false } as AddEventListenerOptions);
    return () => document.removeEventListener('wheel', handleWheel, { capture: true } as EventListenerOptions);
  }, [isLightboxOpen, clampPosition]);

  // Touch: pinch-to-zoom + one-finger pan (capture phase)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const handleTouchStart = (e: TouchEvent) => {
      if (!overlayRef.current?.contains(e.target as Node)) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        lastPinchDistRef.current = getDistance(e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1 && zoomRef.current > 1) {
        if (closeBtnRef.current?.contains(e.target as Node)) return;
        // Only start pan if touch is on the image
        if (!imageRef.current?.contains(e.target as Node)) return;
        e.preventDefault();
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!overlayRef.current?.contains(e.target as Node)) return;
      if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const scale = dist / lastPinchDistRef.current;
        const newZoom = Math.max(1, Math.min(5, zoomRef.current * scale));
        if (newZoom === 1) {
          setPosition({ x: 0, y: 0 });
        } else {
          const clamped = clampPosition(positionRef.current.x, positionRef.current.y, newZoom);
          setPosition(clamped);
        }
        setZoomLevel(newZoom);
        lastPinchDistRef.current = dist;
      } else if (e.touches.length === 1 && zoomRef.current > 1 && lastTouchRef.current) {
        if (closeBtnRef.current?.contains(e.target as Node)) return;
        e.preventDefault();
        const dx = e.touches[0].clientX - lastTouchRef.current.x;
        const dy = e.touches[0].clientY - lastTouchRef.current.y;
        const newPos = clampPosition(positionRef.current.x + dx, positionRef.current.y + dy, zoomRef.current);
        setPosition(newPos);
        lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) lastPinchDistRef.current = null;
      if (e.touches.length === 0) lastTouchRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false } as AddEventListenerOptions);
    document.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false } as AddEventListenerOptions);
    document.addEventListener('touchend', handleTouchEnd, { capture: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true } as EventListenerOptions);
      document.removeEventListener('touchmove', handleTouchMove, { capture: true } as EventListenerOptions);
      document.removeEventListener('touchend', handleTouchEnd, { capture: true });
    };
  }, [isLightboxOpen, clampPosition]);

  // Mouse drag — only starts on the image, uses document-level move/up for smooth tracking
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const newX = e.clientX - dragStartRef.current.x + posStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y + posStartRef.current.y;
      const clamped = clampPosition(newX, newY, zoomRef.current);
      setPosition(clamped);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        didDragRef.current = true;
        setIsDragging(false);
        document.body.classList.remove('no-select');
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLightboxOpen, isDragging, clampPosition]);

  // Mouse down on the image to start dragging
  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (zoomRef.current <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    didDragRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...positionRef.current };
    setIsDragging(true);
    document.body.classList.add('no-select');
  };

  // Click on overlay background = close (works at any zoom level)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the overlay itself, not the image or close button
    if (e.target === overlayRef.current) {
      closeLightbox();
    }
  };

  // Click on image: if not a drag, do nothing (keep lightbox open)
  const handleImageContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDragRef.current) {
      didDragRef.current = false;
    }
  };

  // Add global style for no selection / no drag
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .no-select {
        user-select: none !important;
        -webkit-user-select: none !important;
      }
      .no-drag {
        -webkit-user-drag: none;
        user-drag: none;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const imageStyle: CSSProperties = {
    transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    maxWidth: '90vw',
    maxHeight: '90vh',
    userSelect: 'none',
    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
  };

  return (
    <>
      <div
        onClick={handleImageClick}
        className="cursor-zoom-in w-full h-full overflow-hidden relative"
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

      {/* Lightbox - rendered via portal to escape modal transform context */}
      {isLightboxOpen && createPortal(
        <div
          ref={overlayRef}
          data-lightbox-overlay
          className="fixed inset-0 bg-black bg-opacity-80 z-[9999] flex items-center justify-center"
          onClick={handleOverlayClick}
          style={{ cursor: 'default' }}
        >
          <button
            ref={closeBtnRef}
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full z-[10000] transition-colors"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div
            className="relative"
            onClick={handleImageContainerClick}
            onMouseDown={handleImageMouseDown}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={alt}
              className="no-drag"
              style={imageStyle}
              draggable="false"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}