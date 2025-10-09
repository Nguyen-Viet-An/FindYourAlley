'use client';

import { useState, useEffect, useRef } from 'react';
import { BoothEventMap } from '@/types';
import { BoothPosition } from '@/lib/utils/floormap';
import { generateBoothLayout } from '@/lib/utils/boothLayout';
import ImageCarousel from '@/components/shared/ImageCarousel';

interface StampRally {
  name: string;
  rules: string;
  booths: string[];
  link?: string;
}

interface InteractiveFloorplanProps {
  boothMap: BoothEventMap;
  xmlContent: string;
  uniqueEventTitleCount: number;
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
  uniqueEventTitleCount,
  boothNames,
  stampRallies
}: InteractiveFloorplanProps) {
  const [booths, setBooths] = useState<BoothPosition[]>([]);
  const [hoveredBooth, setHoveredBooth] = useState<HoverData | null>(null);
  const [focusedBooth, setFocusedBooth] = useState<HoverData | null>(null);
  const [focusedStampRally, setFocusedStampRally] = useState<StampRally | null>(null);
  const [hoveredRally, setHoveredRally] = useState<StampRally | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('booth');
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

  // Check if booth is in active rally
  const isBoothInActiveRally = (boothCode: string): boolean => {
    if (!hoveredRally) return false;
    const expandedBooths = expandBoothCodes(hoveredRally.booths);
    return expandedBooths.includes(boothCode);
  };

  // Determine booth opacity in rally mode
  const getBoothOpacity = (boothCode: string): number => {
    if (viewMode !== 'rally' || !hoveredRally) return 1;
    return isBoothInActiveRally(boothCode) ? 1 : 0.2;
  };

  // Handle stamp rally click
  const handleStampRallyClick = (stampRally: StampRally) => {
    setFocusedStampRally(stampRally);
  };

  const handleRallyHover = (rally: StampRally | null) => {
    setHoveredRally(rally);
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
      // In rally mode, hovering booth shows which rally it belongs to
      const rallies = getRalliesForBooth(booth.code);
      if (rallies.length > 0) {
        setHoveredRally(rallies[0]);
      }
    } else {
      // In booth mode, show booth details
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
    // In rally mode, keep rally visible until hovering another booth or line
  };

  const handleClick = (booth: BoothPosition) => {
    if (viewMode === 'booth') {
      const boothData = boothMap[booth.code];
      if (boothData) {
        setFocusedBooth(boothData);
      }
    } else if (viewMode === 'rally') {
      // In rally mode, clicking a booth shows its rally details
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
      'K': { fill: '#fdf2f8', stroke: '#d946ef', hoverFill: '#f5d0fe' }
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
        viewBox="0 0 7000 2700"
        className="border rounded-lg bg-gray-50"
        style={{ width: '1200px', height: 'auto' }}
        preserveAspectRatio="xMidYMid meet"
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
            const isHighlighted = viewMode === 'rally' && isBoothInActiveRally(booth.code);

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

              const isHovered = hoveredRally?.name === rally.name;
              const shouldDim = hoveredRally && hoveredRally.name !== rally.name;

              return (
                <g key={rally.name}>
                  {/* Visible connection line - dotted when not hovered, solid when hovered */}
                  <path
                    d={pathData}
                    stroke={color}
                    strokeWidth={isHovered ? "10" : "6"}
                    fill="none"
                    strokeDasharray={isHovered ? "0" : "12,8"}
                    opacity={shouldDim ? "0.2" : (isHovered ? "0.9" : "0.6")}
                    className="pointer-events-none transition-all duration-200"
                    style={{ filter: isHovered ? 'url(#shadow)' : 'none' }}
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
                    onClick={() => handleStampRallyClick(rally)}
                  />

                  {/* Rally indicators on booths */}
                  {boothPositions.map((booth) => {
                    const center = getBoothCenter(booth);
                    return (
                      <g key={`${rally.name}-${booth.code}`}>
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r={isHovered ? "24" : "16"}
                          fill={color}
                          stroke="white"
                          strokeWidth={isHovered ? "5" : "4"}
                          opacity={shouldDim ? "0.2" : "1"}
                          className="pointer-events-none transition-all duration-200"
                          style={{ filter: isHovered ? 'url(#shadow)' : 'none' }}
                        />
                        {/* Booth number next to dot */}
                        <text
                          x={center.x + (isHovered ? 35 : 28)}
                          y={center.y + 8}
                          fontSize={isHovered ? "50" : "24"}
                          fontWeight="bold"
                          fill={color}
                          opacity={shouldDim ? "0.2" : "1"}
                          className="pointer-events-none select-none transition-all duration-200"
                          style={{
                            filter: isHovered ? 'url(#shadow)' : 'none',
                            textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white'
                          }}
                        >
                          {booth.code}
                        </text>
                      </g>
                    );
                  })}

                  {/* Rally label - always visible in rally mode */}
                  {boothPositions.length > 0 && (() => {
                    const centerX = boothPositions.reduce((sum, booth) => sum + getBoothCenter(booth).x, 0) / boothPositions.length;
                    const centerY = boothPositions.reduce((sum, booth) => sum + getBoothCenter(booth).y, 0) / boothPositions.length - 120;

                    const textWidth = rally.name.length * 48 * 0.6;
                    const boxPadding = 30;

                    // Determine if this rally should be dimmed
                    const shouldDim = hoveredRally && hoveredRally.name !== rally.name;

                    return (
                      <>
                        <rect
                          x={centerX - (textWidth / 2) - boxPadding}
                          y={centerY - 35}
                          width={textWidth + (boxPadding * 2)}
                          height="60"
                          fill="white"
                          stroke={color}
                          strokeWidth={isHovered ? "4" : "3"}
                          rx="8"
                          opacity={shouldDim ? "0.3" : (isHovered ? "1" : "0.9")}
                          className="cursor-pointer transition-all duration-200"
                          style={{ filter: isHovered ? 'url(#shadow)' : 'none' }}
                          onMouseEnter={() => handleRallyHover(rally)}
                          onMouseLeave={() => handleRallyHover(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStampRallyClick(rally);
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
                            handleStampRallyClick(rally);
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
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)'
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
              {/* {hoveredBooth.totalEvents && hoveredBooth.totalEvents > 1 && (
                <p className="text-xs text-blue-600 font-medium">
                  {hoveredBooth.totalEvents} events at this booth
                </p>
              )} */}
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

            {/* {hoveredBooth.hasPreorder && !hoveredBooth.isEmptyBooth && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-amber-600 font-medium">📦 Preorder Available</span>
              </div>
            )} */}
          </div>
        </div>
      )}

      {/* Rally Info Tooltip - Only in rally mode when hovering
      {viewMode === 'rally' && hoveredRally && (
        <div
          className="fixed z-50 pointer-events-none bg-white shadow-xl rounded-lg p-4 max-w-sm border-2 border-blue-500"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-lg text-blue-600">{hoveredRally.name}</h4>
            <p className="text-xs text-gray-700">{expandBoothCodes(hoveredRally.booths).length} booths</p>
            <p className="text-xs text-gray-600">Click line or dots for details</p>
          </div>
        </div>
      )} */}

      {/* Focus Modal - Booth Details */}
      {focusedBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
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

            <div className="p-4">
              {focusedBooth.images && focusedBooth.images.length > 0 && (
                <div className="mb-4">
                  <ImageCarousel
                    images={focusedBooth.images}
                    height="320px"
                    className="w-full rounded-lg overflow-hidden"
                  />
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
                            Thông tin chi tiết
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <a
                  href={`/events/${focusedBooth.eventId}`}
                  className="flex-1 bg-primary-500 text-white text-center py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Thông tin chi tiết
                </a>
                <button
                  onClick={() => setFocusedBooth(null)}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stamp Rally Modal */}
      {focusedStampRally && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{focusedStampRally.name}</h3>
              </div>
              <button
                onClick={() => setFocusedStampRally(null)}
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
                        🔗 Xem bài viết gốc
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
                  🏪 Các gian tham gia ({focusedStampRally.booths.length} gian):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {expandBoothCodes(focusedStampRally.booths).map((boothCode) => {
                    const boothName = getBoothName(boothCode);
                    return (
                      <div
                        key={boothCode}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {boothCode}
                        {boothName && (
                          <span className="text-blue-600 ml-1">- {boothName}</span>
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
          <>Tổng cộng: {booths.length} gian | Có sample: {uniqueEventTitleCount} gian</>
        ) : (
          <>Số lượng Stamp Rally: {stampRallies.length} | Tổng hợp bởi: Vu Huyen Anh (Fb)</>
        )}
      </div>
    </div>
  );
}
