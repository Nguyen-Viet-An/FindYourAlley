'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BoothEventMap } from '@/types';
import { BoothPosition } from '@/lib/utils/floormap';
import { getFestivalLayout, FestivalLayout, DEFAULT_SECTION_COLOR } from '@/lib/utils/boothLayout';
import ImageCarousel from '@/components/shared/ImageCarousel';

interface StampRally {
  name: string;
  rules: string;
  booths: string[];
  artists?: string[];
  link?: string;
}

interface InteractiveFloorplanProps {
  boothMap: BoothEventMap;
  xmlContent: string;
  boothNames: { [key: string]: string };
  stampRallies: StampRally[];
  festivalCode?: string;
}

interface HoverData {
  eventId?: string;
  title: string;
  boothLabel: string;
  boothName: string;
  thumb?: string;
  hasPreorder?: boolean;
  allEvents?: any[];
  images?: string[];
  totalEvents?: number;
  isEmptyBooth?: boolean;
}

type ViewMode = 'booth' | 'rally';

export default function InteractiveFloorplan({
  boothMap,
  xmlContent,
  boothNames,
  stampRallies,
  festivalCode
}: InteractiveFloorplanProps) {
  const [layout, setLayout] = useState<FestivalLayout | null>(null);
  const [booths, setBooths] = useState<BoothPosition[]>([]);
  const [hoveredBooth, setHoveredBooth] = useState<HoverData | null>(null);
  const [focusedBooth, setFocusedBooth] = useState<HoverData | null>(null);
  const [focusedStampRally, setFocusedStampRally] = useState<StampRally | null>(null);
  const [hoveredRally, setHoveredRally] = useState<StampRally | null>(null);
  const [selectedRallies, setSelectedRallies] = useState<StampRally[]>([]);
  const [activeRally, setActiveRally] = useState<StampRally | null>(null); // For clicked rally that stays highlighted
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('booth');
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom & pan state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 7100, h: 2700 });
  const [initialViewBox, setInitialViewBox] = useState({ x: 0, y: 0, w: 7100, h: 2700 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const isZoomed = useRef(false);
  const lastTouchTime = useRef(0);
  const [isZoomedState, setIsZoomedState] = useState(false);

  const updateIsZoomed = (val: boolean) => {
    isZoomed.current = val;
    setIsZoomedState(val);
  };

  // Sync isZoomedState with viewBox changes
  useEffect(() => {
    const zoomed = Math.abs(viewBox.w - initialViewBox.w) > 1 || Math.abs(viewBox.h - initialViewBox.h) > 1;
    setIsZoomedState(zoomed);
  }, [viewBox, initialViewBox]);

  // Generate booth layout
  useEffect(() => {
    try {
      const festivalLayout = getFestivalLayout(festivalCode);
      setLayout(festivalLayout);
      setBooths(festivalLayout.booths);

      // Parse viewBox string into numeric values
      const parts = (festivalLayout.viewBox ?? '0 0 7100 2700').split(/\s+/).map(Number);
      const vb = { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
      setViewBox(vb);
      setInitialViewBox(vb);

      setLoading(false);
    } catch (error) {
      console.error('Error generating booth layout:', error);
      setLoading(false);
    }
  }, [festivalCode]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect dark mode
  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains('dark'));
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Zoom with mouse wheel
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;

      // Get cursor position in SVG coordinates
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      setViewBox(prev => {
        const newW = prev.w * zoomFactor;
        const newH = prev.h * zoomFactor;
        // Don't zoom out beyond 2x the initial size
        if (newW > initialViewBox.w * 2 || newH > initialViewBox.h * 2) return prev;
        // Don't zoom in beyond 10% of initial
        if (newW < initialViewBox.w * 0.1) return prev;
        const next = {
          x: prev.x + (prev.w - newW) * mx,
          y: prev.y + (prev.h - newH) * my,
          w: newW,
          h: newH,
        };
        isZoomed.current = Math.abs(next.w - initialViewBox.w) > 1 || Math.abs(next.h - initialViewBox.h) > 1;
        return next;
      });
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [initialViewBox]);

  // Touch zoom/pan (pinch + drag)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const getTouchDist = (t: TouchList) => {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy);
    };
    const getTouchCenter = (t: TouchList) => ({
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastTouchDist.current = getTouchDist(e.touches);
        lastTouchCenter.current = getTouchCenter(e.touches);
      } else if (e.touches.length === 1 && isZoomed.current) {
        // Only capture single-finger drag when zoomed in; otherwise let the page scroll
        e.preventDefault();
        isPanning.current = true;
        hasDragged.current = false;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDist.current !== null) {
        e.preventDefault();
        const newDist = getTouchDist(e.touches);
        const zoomFactor = lastTouchDist.current / newDist;

        const rect = svg.getBoundingClientRect();
        const center = getTouchCenter(e.touches);
        const mx = (center.x - rect.left) / rect.width;
        const my = (center.y - rect.top) / rect.height;

        // Pan from center movement
        const prevCenter = lastTouchCenter.current!;
        const dx = (prevCenter.x - center.x) / rect.width;
        const dy = (prevCenter.y - center.y) / rect.height;

        setViewBox(prev => {
          const newW = Math.max(initialViewBox.w * 0.1, Math.min(initialViewBox.w * 2, prev.w * zoomFactor));
          const newH = Math.max(initialViewBox.h * 0.1, Math.min(initialViewBox.h * 2, prev.h * zoomFactor));
          const next = {
            x: prev.x + (prev.w - newW) * mx + dx * prev.w,
            y: prev.y + (prev.h - newH) * my + dy * prev.h,
            w: newW,
            h: newH,
          };
          isZoomed.current = Math.abs(next.w - initialViewBox.w) > 1 || Math.abs(next.h - initialViewBox.h) > 1;
          return next;
        });

        lastTouchDist.current = newDist;
        lastTouchCenter.current = center;
      } else if (e.touches.length === 1 && isPanning.current) {
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        const dx = (panStart.current.x - e.touches[0].clientX) / rect.width;
        const dy = (panStart.current.y - e.touches[0].clientY) / rect.height;
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) hasDragged.current = true;

        setViewBox(prev => ({
          ...prev,
          x: prev.x + dx * prev.w,
          y: prev.y + dy * prev.h,
        }));
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchEnd = () => {
      isPanning.current = false;
      lastTouchDist.current = null;
      lastTouchCenter.current = null;
      lastTouchTime.current = Date.now();
    };

    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    svg.addEventListener('touchmove', handleTouchMove, { passive: false });
    svg.addEventListener('touchend', handleTouchEnd);
    return () => {
      svg.removeEventListener('touchstart', handleTouchStart);
      svg.removeEventListener('touchmove', handleTouchMove);
      svg.removeEventListener('touchend', handleTouchEnd);
    };
  }, [initialViewBox]);

  // Pan with mouse drag
  const handlePanStart = (e: React.MouseEvent) => {
    // Skip synthetic mouse events after touch
    if (Date.now() - lastTouchTime.current < 500) return;
    if (e.button === 0) {
      isPanning.current = true;
      hasDragged.current = false;
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = (panStart.current.x - e.clientX) / rect.width;
    const dy = (panStart.current.y - e.clientY) / rect.height;
    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) hasDragged.current = true;

    setViewBox(prev => ({
      ...prev,
      x: prev.x + dx * prev.w,
      y: prev.y + dy * prev.h,
    }));
    panStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePanEnd = () => {
    isPanning.current = false;
  };

  const handleZoom = (factor: number) => {
    setViewBox(prev => {
      const newW = Math.max(initialViewBox.w * 0.1, Math.min(initialViewBox.w * 2, prev.w * factor));
      const newH = Math.max(initialViewBox.h * 0.1, Math.min(initialViewBox.h * 2, prev.h * factor));
      const next = {
        x: prev.x + (prev.w - newW) / 2,
        y: prev.y + (prev.h - newH) / 2,
        w: newW,
        h: newH,
      };
      isZoomed.current = Math.abs(next.w - initialViewBox.w) > 1 || Math.abs(next.h - initialViewBox.h) > 1;
      return next;
    });
  };

  const handleResetZoom = () => {
    setViewBox(initialViewBox);
    isZoomed.current = false;
  };

  // Clear selected rallies when switching view modes
  useEffect(() => {
    setSelectedRallies([]);
    setActiveRally(null);
    setHoveredRally(null);
    setFocusedStampRally(null);
  }, [viewMode]);

  // Helper function to expand booth codes (handles ranges like "G23-24")
  const expandBoothCodes = (boothCodes: string[]): string[] => {
    const expanded: string[] = [];
    boothCodes.forEach(code => {
      if (code.includes('-')) {
        const match = code.match(/([A-Z]+)(\d+)-(\d+)/);
        if (match) {
          const [, section, start, end] = match;
          const startNum = parseInt(start);
          const endNum = parseInt(end);
          for (let i = startNum; i <= endNum; i++) {
            expanded.push(`${section}${i}`);
          }
        } else {
          expanded.push(code);
        }
      } else {
        expanded.push(code);
      }
    });
    return expanded;
  };

  // Helper function to get booth position by code
  const getBoothPosition = (boothCode: string) => {
    return booths.find(booth => booth.code === boothCode);
  };

  // Helper function to calculate center point of a booth
  const getBoothCenter = (booth: any) => {
    return {
      x: booth.x + booth.width / 2,
      y: booth.y + booth.height / 2
    };
  };

  // Generate stamp rally colors
  const getStampRallyColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#ef4444', // red
      '#10b981', // green
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
    ];
    return colors[index % colors.length];
  };

  // Find which rally(ies) a booth belongs to
  const getRalliesForBooth = (boothCode: string): StampRally[] => {
    return stampRallies.filter(rally => {
      const expandedBooths = expandBoothCodes(rally.booths);
      return expandedBooths.includes(boothCode);
    });
  };

  // Check if booth is in active rallies (considers both hover and active states)
  const isBoothInActiveRallies = (boothCode: string): boolean => {
    const checkRally = activeRally || hoveredRally;
    if (!checkRally) return false;

    const expandedBooths = expandBoothCodes(checkRally.booths);
    return expandedBooths.includes(boothCode);
  };

  // Determine booth opacity in rally mode
  // Determine booth opacity in rally mode
  const getBoothOpacity = (boothCode: string): number => {
    if (viewMode !== 'rally') return 1;

    // If rallies are selected (filtered mode), check against selected rallies
    if (selectedRallies.length > 0) {
      const isInSelectedRallies = selectedRallies.some(rally => {
        const expandedBooths = expandBoothCodes(rally.booths);
        return expandedBooths.includes(boothCode);
      });

      // If booth is not in any selected rally, dim it
      if (!isInSelectedRallies) return 0.2;

      // If booth is in selected rallies and there's an active/hovered rally, apply highlighting
      if (activeRally || hoveredRally) {
        return isBoothInActiveRallies(boothCode) ? 1 : 0.2;
      }

      // Otherwise, show all selected rally booths at full opacity
      return 1;
    }

    // If no rallies selected, normal behavior with hover/active
    if (activeRally || hoveredRally) {
      return isBoothInActiveRallies(boothCode) ? 1 : 0.2;
    }

    return 1;
  };

  // Handle stamp rally click on map - sets active rally (stays highlighted until another is clicked)
  const handleStampRallyMapClick = (stampRally: StampRally) => {
    // Toggle active rally
    if (activeRally?.name === stampRally.name) {
      setActiveRally(null);
    } else {
      setActiveRally(stampRally);
    }
    // Also open the modal
    setFocusedStampRally(stampRally);
  };

  // Handle stamp rally click in selector - toggles selection (filtering)
  const handleStampRallySelectorClick = (stampRally: StampRally) => {
    setSelectedRallies(prev => {
      const isAlreadySelected = prev.some(r => r.name === stampRally.name);
      if (isAlreadySelected) {
        return prev.filter(r => r.name !== stampRally.name);
      } else {
        return [...prev, stampRally];
      }
    });
  };

  const handleRallyHover = (rally: StampRally | null) => {
    if (!isMobile && !activeRally) {
      setHoveredRally(rally);
    }
  };

  // Handle clicking outside to close modal
  const handleBackgroundClick = () => {
    if (focusedStampRally) {
      setFocusedStampRally(null);
    } else {
      // Clear active rally when clicking background
      setActiveRally(null);
    }
  };

  // Handle closing stamp rally modal (keep rally selected)
  const handleCloseStampRallyModal = () => {
    setFocusedStampRally(null);
  };

  // Helper function to get booth name from boothNames object
  const getBoothName = (boothCode: string): string | null => {
    if (boothNames[boothCode]) {
      return boothNames[boothCode];
    }

    for (const [key, name] of Object.entries(boothNames)) {
      if (key.includes('-')) {
        const match = key.match(/([A-Z]+)(\d+)-(\d+)/);
        if (match) {
          const [, section, start, end] = match;
          const startNum = parseInt(start);
          const endNum = parseInt(end);

          const boothMatch = boothCode.match(/([A-Z]+)(\d+)/);
          if (boothMatch) {
            const [, boothSection, boothNumStr] = boothMatch;
            const boothNum = parseInt(boothNumStr);

            if (boothSection === section && boothNum >= startNum && boothNum <= endNum) {
              return name;
            }
          }
        }
      }
    }

    return null;
  };

  const handleMouseEnter = (booth: BoothPosition, event: React.MouseEvent) => {
    if (viewMode === 'rally') {
      const rallies = getRalliesForBooth(booth.code);
      if (rallies.length > 0) {
        setHoveredRally(rallies[0]);
      }
    } else {
      const boothData = boothMap[booth.code];
      if (boothData) {
        setHoveredBooth(boothData);
        setMousePosition({ x: event.clientX, y: event.clientY });
      } else {
        const boothName = getBoothName(booth.code);
        if (boothName) {
          const emptyBoothData: HoverData = {
            title: boothName,
            boothLabel: booth.code,
            boothName: boothName,
            isEmptyBooth: true
          };
          setHoveredBooth(emptyBoothData);
          setMousePosition({ x: event.clientX, y: event.clientY });
        }
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    if (viewMode === 'booth') {
      setHoveredBooth(null);
    }
  };

  const handleClick = (booth: BoothPosition) => {
    if (hasDragged.current) return; // Suppress click after drag/pan
    if (viewMode === 'booth') {
      const boothData = boothMap[booth.code];
      if (boothData) {
        setFocusedBooth(boothData);
      } else {
        // Show booth name for empty booths
        const boothName = getBoothName(booth.code);
        if (boothName) {
          const emptyBoothData: HoverData = {
            title: boothName,
            boothLabel: booth.code,
            boothName: boothName,
            isEmptyBooth: true
          };
          setFocusedBooth(emptyBoothData);
        }
      }
    } else if (viewMode === 'rally') {
      const rallies = getRalliesForBooth(booth.code);
      if (rallies.length > 0) {
        setFocusedStampRally(rallies[0]);
      }
    }
  };

  const getSectionColor = (section: string) => {
    return layout?.sectionColors[section] ?? DEFAULT_SECTION_COLOR;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading floor map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* View Mode Toggle */}
      <div className="flex justify-center mb-4 gap-2">
        <button
          onClick={() => setViewMode('booth')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            viewMode === 'booth'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
           📍 Gian hàng
        </button>
        <button
          onClick={() => setViewMode('rally')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            viewMode === 'rally'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🗳 Stamp Rally
        </button>
      </div>

      {/* Zoom controls */}
      <div className="flex justify-center gap-1.5 mb-2">
        <button
          onClick={() => handleZoom(0.7)}
          className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-muted dark:hover:bg-muted/80 text-xs font-medium"
          title="Phóng to"
        >
          🔍+
        </button>
        <button
          onClick={() => handleZoom(1.4)}
          className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-muted dark:hover:bg-muted/80 text-xs font-medium"
          title="Thu nhỏ"
        >
          🔍−
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-muted dark:hover:bg-muted/80 text-xs font-medium"
          title="Đặt lại"
        >
          ↺ Reset
        </button>
      </div>

      {/* SVG Floorplan */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="border rounded-lg w-full max-w-none mx-auto cursor-grab active:cursor-grabbing bg-gray-50 dark:bg-gray-900"
        style={{ touchAction: isZoomedState ? 'none' : 'manipulation' }}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handlePanStart}
        onMouseMove={(e) => { handlePanMove(e); handleMouseMove(e); }}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onClick={(e) => { if (!hasDragged.current) handleBackgroundClick(); }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke={isDark ? '#374151' : '#e5e7eb'} strokeWidth="2" opacity="0.2"/>
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Section Labels */}
        <g className="section-labels">
          {layout?.sectionLabels.map((label, idx) => (
            <text
              key={`${label.section}-${idx}`}
              x={label.x}
              y={label.y}
              fontSize={label.fontSize}
              fontWeight="bold"
              fill={label.color}
              textAnchor="middle"
            >
              {label.section}
            </text>
          ))}
        </g>

        {/* Render booths */}
        <g className="booths">
          {booths.map((booth) => {
            const hasEvent = boothMap[booth.code];
            const colors = getSectionColor(booth.section);
            const opacity = getBoothOpacity(booth.code);
            const isHighlighted = viewMode === 'rally' && isBoothInActiveRallies(booth.code);

            return (
              <g
                key={booth.code}
                className="booth-group"
                opacity={opacity}
                style={{ transition: 'opacity 0.3s' }}
              >
                <rect
                  x={booth.x}
                  y={booth.y}
                  width={booth.width}
                  height={booth.height}
                  fill={hasEvent ? (isDark ? colors.darkFill : colors.fill) : (isDark ? '#1f2937' : '#f9fafb')}
                  stroke={isHighlighted ? getStampRallyColor(0) : (hasEvent ? colors.stroke : (isDark ? '#4b5563' : '#d1d5db'))}
                  strokeWidth={isHighlighted ? "4" : "2"}
                  className={`cursor-pointer transition-all duration-200 ${
                    hasEvent ? 'hover:opacity-80' : 'hover:fill-gray-100'
                  }`}
                  style={{
                    filter: isHighlighted ? 'url(#shadow)' : 'none'
                  }}
                  onMouseEnter={(e) => handleMouseEnter(booth, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(booth)}
                />

                <text
                  x={booth.x + booth.width / 2}
                  y={booth.y + booth.height / 2 + 12}
                  textAnchor="middle"
                  fontSize="36"
                  fontWeight="bold"
                  fill={hasEvent ? (isDark ? '#e5e7eb' : '#374151') : (isDark ? '#6b7280' : '#9ca3af')}
                  className="pointer-events-none select-none"
                >
                  {booth.number}
                </text>

                {hasEvent && (
                  <circle
                    cx={booth.x + booth.width - 8}
                    cy={booth.y + 8}
                    r="4"
                    fill={colors.stroke}
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Stamp Rally Connections - Show in rally mode - Render AFTER booths */}
        {viewMode === 'rally' && (
          <g className="stamp-rallies">
            {stampRallies.map((rally, rallyIndex) => {
              // Check if this rally should be shown based on selection filter
              const shouldShowRally = selectedRallies.length === 0 || selectedRallies.some(r => r.name === rally.name);

              // If rallies are selected and this rally is not selected, hide it completely
              if (!shouldShowRally) {
                return null;
              }

              const color = getStampRallyColor(rallyIndex);
              const expandedBooths = expandBoothCodes(rally.booths);
              const boothPositions = expandedBooths
                .map(boothCode => getBoothPosition(boothCode))
                .filter((booth): booth is BoothPosition => booth !== undefined);

              if (boothPositions.length < 2) return null;

              const pathData = boothPositions.map((booth, index) => {
                const center = getBoothCenter(booth);
                return index === 0 ? `M ${center.x} ${center.y}` : `L ${center.x} ${center.y}`;
              }).join(' ');

              // Check if this rally is active (clicked) or hovered
              const isActive = activeRally?.name === rally.name;
              const isHovered = !activeRally && hoveredRally?.name === rally.name;
              const shouldDim = (activeRally && activeRally.name !== rally.name) || (!activeRally && hoveredRally && hoveredRally.name !== rally.name);

              return (
                <g key={rally.name}>
                  {/* Visible connection line */}
                  <path
                    d={pathData}
                    stroke={color}
                    strokeWidth={(isActive || isHovered) ? "10" : "6"}
                    fill="none"
                    strokeDasharray={(isActive || isHovered) ? "0" : "12,8"}
                    opacity={shouldDim ? "0.3" : ((isActive || isHovered) ? "0.9" : "0.6")}
                    className="pointer-events-none transition-all duration-200"
                    style={{ filter: (isActive || isHovered) ? 'url(#shadow)' : 'none' }}
                  />

                  {/* Invisible wider path for easier hovering */}
                  <path
                    d={pathData}
                    stroke="transparent"
                    strokeWidth="30"
                    fill="none"
                    className="cursor-pointer"
                    onMouseEnter={() => handleRallyHover(rally)}
                    onMouseLeave={() => handleRallyHover(null)}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleStampRallyMapClick(rally);
                    }}
                    />

                  {/* Rally indicators on booths */}
                  {boothPositions.map((booth) => {
                    const center = getBoothCenter(booth);
                    return (
                      <g key={`${rally.name}-${booth.code}`}>
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r={(isActive || isHovered) ? "24" : "16"}
                          fill={color}
                          stroke="white"
                          strokeWidth={(isActive || isHovered) ? "5" : "4"}
                          opacity={shouldDim ? "0.2" : "1"}
                          className="pointer-events-none transition-all duration-200"
                          style={{ filter: (isActive || isHovered) ? 'url(#shadow)' : 'none' }}
                        />
                        <text
                          x={center.x + ((isActive || isHovered) ? 35 : 28)}
                          y={center.y + (boothPositions.findIndex(b => b.code === booth.code) % 2 === 0 ? 8 : -8)}
                          fontSize={(isActive || isHovered) ? "50" : "20"}
                          fontWeight="bold"
                          fill={color}
                          opacity={shouldDim ? "0.2" : "1"}
                          className="pointer-events-none select-none transition-all duration-200"
                          style={{
                            filter: (isActive || isHovered) ? 'url(#shadow)' : 'none',
                            textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white'
                          }}
                        >
                          {booth.code}
                        </text>
                      </g>
                    );
                  })}

                  {/* Rally label */}
                  {boothPositions.length > 0 && (() => {
                    const centerX = boothPositions.reduce((sum, booth) => sum + getBoothCenter(booth).x, 0) / boothPositions.length;
                    const centerY = boothPositions.reduce((sum, booth) => sum + getBoothCenter(booth).y, 0) / boothPositions.length - 120;

                    const textWidth = rally.name.length * 48 * 0.6;
                    const boxPadding = 30;

                    return (
                      <>
                        <rect
                          x={centerX - (textWidth / 2) - boxPadding}
                          y={centerY - 35}
                          width={textWidth + (boxPadding * 2)}
                          height="60"
                          fill="white"
                          stroke={color}
                          strokeWidth={(isActive || isHovered) ? "4" : "3"}
                          rx="8"
                          opacity={shouldDim ? "0.1" : ((isActive || isHovered) ? "1" : "0.9")}
                          className="cursor-pointer transition-all duration-200"
                          style={{ filter: (isActive || isHovered) ? 'url(#shadow)' : 'none' }}
                          onMouseEnter={() => handleRallyHover(rally)}
                          onMouseLeave={() => handleRallyHover(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStampRallyMapClick(rally);
                          }}
                        />
                        <text
                          x={centerX}
                          y={centerY + 5}
                          textAnchor="middle"
                          fontSize="48"
                          fontWeight="bold"
                          fill={color}
                          opacity={shouldDim ? "0.3" : "1"}
                          className="cursor-pointer select-none transition-all duration-200"
                          onMouseEnter={() => handleRallyHover(rally)}
                          onMouseLeave={() => handleRallyHover(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStampRallyMapClick(rally);
                          }}
                        >
                          {rally.name}
                        </text>
                      </>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Hover Tooltip - Only in booth mode */}
      {viewMode === 'booth' && hoveredBooth && (
        <div
          className={`fixed z-50 pointer-events-none shadow-xl rounded-lg p-4 max-w-sm border-2 ${
            hoveredBooth.isEmptyBooth ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
          }`}
          style={{
            left: isMobile ? '50%' : mousePosition.x + 15,
            top: isMobile ? '50%' : mousePosition.y - 10,
            transform: isMobile ? 'translate(-50%, -50%)' : 'translateY(-100%)'
          }}
        >
          <div className="flex flex-col gap-3">
            <div>
              <h4 className={`font-semibold text-sm line-clamp-2 ${
                hoveredBooth.isEmptyBooth ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {hoveredBooth.title}
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Vị trí gian: {hoveredBooth.boothLabel}
              </p>
            </div>

            {hoveredBooth.thumb && !hoveredBooth.isEmptyBooth && (
              <img
                src={hoveredBooth.thumb}
                alt={hoveredBooth.title}
                className="w-full h-24 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/images/placeholder.png';
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Focus Modal - Booth Details */}
      {focusedBooth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFocusedBooth(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold line-clamp-2 pr-4">{focusedBooth.title}</h3>
              </div>
              <button
                onClick={() => setFocusedBooth(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {focusedBooth.images && focusedBooth.images.length > 0 && (
                <div className="mb-4">
                  <div className="w-full h-80 overflow-hidden rounded-lg">
                    <ImageCarousel
                      images={focusedBooth.images}
                      height="320px"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Vị trí gian:</span>
                  <span className="ml-2 text-gray-900">{focusedBooth.boothLabel}</span>
                </div>

                {focusedBooth.boothName && (
                  <div>
                    <span className="font-medium text-gray-700">Tên gian:</span>
                    <span className="ml-2 text-gray-900">{focusedBooth.boothName}</span>
                  </div>
                )}

                {focusedBooth.allEvents && focusedBooth.allEvents.length > 1 && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700 block mb-2">Tất cả sample:</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {focusedBooth.allEvents.map((event, index) => (
                        <div key={event.eventId} className="border border-gray-200 rounded p-2 text-sm">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{event.title}</h4>
                          <a
                            href={`/events/${event.eventId}`}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Chi tiết
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!focusedBooth.isEmptyBooth && focusedBooth.allEvents?.length===1 && (
                <div className="mt-6 flex gap-3">
                  <a
                    href={`/events/${focusedBooth.eventId}`}
                    className="flex-1 bg-primary-500 text-white text-center py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                  >
                    Thông tin chi tiết
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stamp Rally Modal */}
      {focusedStampRally && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
              handleCloseStampRallyModal();
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{focusedStampRally.name}</h3>
              </div>
              <button
                onClick={handleCloseStampRallyModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold flex-shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">🎯 Quy tắc tham gia:</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {focusedStampRally.rules}
                  </div>
                  {focusedStampRally.link && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <a
                        href={focusedStampRally.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        🔗 Xem bài đăng chính thức
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  🏪 Các gian tham gia ({focusedStampRally.booths.length} trạm):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expandBoothCodes(focusedStampRally.booths).map((boothCode, index) => {
                    const boothName = getBoothName(boothCode);
                    const originalBoothIndex = focusedStampRally.booths.findIndex(originalBooth => {
                      if (originalBooth.includes('-')) {
                        const match = originalBooth.match(/([A-Z]+)(\d+)-(\d+)/);
                        if (match) {
                          const [, section, start, end] = match;
                          const startNum = parseInt(start);
                          const endNum = parseInt(end);
                          const boothMatch = boothCode.match(/([A-Z]+)(\d+)/);
                          if (boothMatch) {
                            const [, boothSection, boothNumStr] = boothMatch;
                            const boothNum = parseInt(boothNumStr);
                            return boothSection === section && boothNum >= startNum && boothNum <= endNum;
                          }
                        }
                      }
                      return originalBooth === boothCode;
                    });
                    const artist = focusedStampRally.artists && originalBoothIndex >= 0 ? focusedStampRally.artists[originalBoothIndex] : null;

                    return (
                      <div
                        key={boothCode}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {boothCode}
                        {boothName && (
                          <span className="text-blue-600 ml-1">- {boothName}</span>
                        )}
                        {artist && (
                          <span className="text-blue-700 ml-1">({artist})</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booth count summary */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        {viewMode === 'booth' ? (
          <>Tổng cộng: {booths.length} gian </>
        ) : (
          <>Số lượng Stamp Rally: {stampRallies.length} | Tổng hợp bởi: Vu Huyen Anh (Fb)</>
        )}
      </div>

      {/* Credit */}
      {layout?.credit && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">{layout.credit}</p>
      )}

            {/* Stamp Rally Selector - Only shown in rally mode */}
      {viewMode === 'rally' && (
        <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Chọn Stamp Rally (có thể chọn nhiều):</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stampRallies.map((rally, index) => {
              const isSelected = selectedRallies.some(r => r.name === rally.name);
              const color = getStampRallyColor(index);

              return (
                <label
                  key={rally.name}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    const isAlreadySelected = selectedRallies.some(r => r.name === rally.name);
                    if (isAlreadySelected) {
                      setSelectedRallies(prev => prev.filter(r => r.name !== rally.name));
                    } else {
                      setSelectedRallies(prev => [...prev, rally]);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 flex-shrink-0"
                    style={{ accentColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-gray-900 text-sm">{rally.name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {expandBoothCodes(rally.booths).length} trạm
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          {selectedRallies.length > 0 && (
            <button
              onClick={() => {
                setSelectedRallies([]);
                setActiveRally(null);
              }}
              className="mt-3 w-full text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Xóa tất cả lựa chọn ({selectedRallies.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}