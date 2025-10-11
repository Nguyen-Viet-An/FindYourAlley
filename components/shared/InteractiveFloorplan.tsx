'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BoothEventMap } from '@/types';
import { BoothPosition } from '@/lib/utils/floormap';
import { generateBoothLayout } from '@/lib/utils/boothLayout';
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
  stampRallies
}: InteractiveFloorplanProps) {
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
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate booth layout
  useEffect(() => {
    try {
      const generatedBooths = generateBoothLayout();
      setBooths(generatedBooths);
      setLoading(false);
    } catch (error) {
      console.error('Error generating booth layout:', error);
      setLoading(false);
    }
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    const colors: { [key: string]: { fill: string; stroke: string; hoverFill: string } } = {
      'A': { fill: '#fef3c7', stroke: '#f59e0b', hoverFill: '#fde68a' },
      'B': { fill: '#dbeafe', stroke: '#3b82f6', hoverFill: '#bfdbfe' },
      'C': { fill: '#dcfce7', stroke: '#10b981', hoverFill: '#bbf7d0' },
      'D': { fill: '#fce7f3', stroke: '#ec4899', hoverFill: '#fbcfe8' },
      'E': { fill: '#e0e7ff', stroke: '#6366f1', hoverFill: '#c7d2fe' },
      'F': { fill: '#fed7d7', stroke: '#ef4444', hoverFill: '#fecaca' },
      'G': { fill: '#d1fae5', stroke: '#059669', hoverFill: '#a7f3d0' },
      'H': { fill: '#fef2e2', stroke: '#f97316', hoverFill: '#fed7aa' },
      'J': { fill: '#f3e8ff', stroke: '#8b5cf6', hoverFill: '#e9d5ff' },
      'K': { fill: '#fdf2f8', stroke: '#d946ef', hoverFill: '#f5d0fe' },
      'P': { fill: '#d1d5db', stroke: '#6b7280', hoverFill: '#e5e7eb' }
    };
    return colors[section] || { fill: '#f3f4f6', stroke: '#6b7280', hoverFill: '#e5e7eb' };
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

      {/* SVG Floorplan */}
      <svg
        ref={svgRef}
        viewBox="0 0 7100 2700"
        className="border rounded-lg bg-gray-50 w-full max-w-[1200px] mx-auto"
        preserveAspectRatio="xMidYMid meet"
        onClick={handleBackgroundClick}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#e5e7eb" strokeWidth="2" opacity="0.2"/>
          </pattern>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Section Labels */}
        <g className="section-labels">
          <text x="800" y="2520" fontSize="80" fontWeight="bold" fill="#f59e0b" textAnchor="middle">A</text>
          <text x="5400" y="2520" fontSize="80" fontWeight="bold" fill="#6b7280" textAnchor="middle">P</text>
          <text x="350" y="2110" fontSize="80" fontWeight="bold" fill="#3b82f6" textAnchor="middle">B</text>
          <text x="350" y="1710" fontSize="80" fontWeight="bold" fill="#10b981" textAnchor="middle">C</text>
          <text x="350" y="1310" fontSize="80" fontWeight="bold" fill="#ec4899" textAnchor="middle">D</text>
          <text x="350" y="910" fontSize="80" fontWeight="bold" fill="#6366f1" textAnchor="middle">E</text>
          <text x="4500" y="2110" fontSize="80" fontWeight="bold" fill="#ef4444" textAnchor="middle">F</text>
          <text x="4500" y="1710" fontSize="80" fontWeight="bold" fill="#059669" textAnchor="middle">G</text>
          <text x="4500" y="1310" fontSize="80" fontWeight="bold" fill="#f97316" textAnchor="middle">H</text>
          <text x="4500" y="910" fontSize="80" fontWeight="bold" fill="#8b5cf6" textAnchor="middle">J</text>
          <text x="4000" y="300" fontSize="80" fontWeight="bold" fill="#d946ef" textAnchor="middle">K</text>
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
                  fill={hasEvent ? colors.fill : '#f9fafb'}
                  stroke={isHighlighted ? getStampRallyColor(0) : (hasEvent ? colors.stroke : '#d1d5db')}
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
                  fill={hasEvent ? '#374151' : '#9ca3af'}
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
                    opacity={shouldDim ? "0.2" : ((isActive || isHovered) ? "0.9" : "0.6")}
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

              {!focusedBooth.isEmptyBooth && (
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