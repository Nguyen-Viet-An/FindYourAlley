import { FestivalLayout } from './types';

export default function createLayout(): FestivalLayout {
  const booths: FestivalLayout['booths'] = [];

  const BOOTH_W = 110;
  const BOOTH_H = 110;
  const GAP = 10;
  const STEP = BOOTH_W + GAP; // 120
  const ROW_GAP = 150;
  const SECTION_GAP = 350;

  const P_W = 140;
  const P_H = BOOTH_H; // same height as normal booths

  const LEFT_X = 330;
  const LEFT_END = LEFT_X + 19 * STEP; // 2610
  const MID_GAP = 670;
  const RIGHT_X = LEFT_END + MID_GAP; // 3280
  const RIGHT_END = RIGHT_X + 20 * STEP; // 5680

  // P1-8 right after A-D
  const P_GAP_X = LEFT_END + 80;
  // P9-16 in the gap, right before E-H
  const P_RIGHT_X = RIGHT_X - 80 - P_W;

  // A on top, sections go downward
  const BASE_Y = 200;
  const sectionY = (idx: number) => BASE_Y + idx * SECTION_GAP;

  // A-D: left side, 38 booths = 2 rows of 19
  // First half (1-19) on TOP, second half (20-38) on BOTTOM
  const leftSections = ['A', 'B', 'C', 'D'];
  leftSections.forEach((name, sIdx) => {
    const half = 19;
    const topY = sectionY(sIdx);
    const botY = topY + ROW_GAP;

    for (let i = 1; i <= 38; i++) {
      const x = LEFT_X + ((i <= half ? i - 1 : i - half - 1)) * STEP;
      const y = i <= half ? topY : botY;
      booths.push({ code: `${name}${i}`, section: name, number: i, x, y, width: BOOTH_W, height: BOOTH_H });
    }
  });

  // E-H: right side, 40 booths = 2 rows of 20
  // First half (1-20) on TOP, second half (21-40) on BOTTOM
  const rightSections = ['E', 'F', 'G', 'H'];
  rightSections.forEach((name, sIdx) => {
    const half = 20;
    const topY = sectionY(sIdx);
    const botY = topY + ROW_GAP;

    for (let i = 1; i <= 40; i++) {
      const x = RIGHT_X + ((i <= half ? i - 1 : i - half - 1)) * STEP;
      const y = i <= half ? topY : botY;
      booths.push({ code: `${name}${i}`, section: name, number: i, x, y, width: BOOTH_W, height: BOOTH_H });
    }
  });

  // P: 16 booths, 2 per section row (one per row)
  // P1-P8: in the gap, closer to A-D
  // P9-P16: in the gap, closer to E-H
  for (let i = 1; i <= 16; i++) {
    const pairIdx = Math.floor((i - 1) / 2); // 0..7
    const isBottom = (i - 1) % 2 === 1;      // odd P# = top row, even P# = bottom row
    const sIdx = pairIdx % 4;                 // section row 0-3
    const isRight = pairIdx >= 4;             // P9-16

    const topY = sectionY(sIdx);
    const y = isBottom ? topY + ROW_GAP : topY;

    // Center single P booth in the gap (or right side)
    const x = isRight ? P_RIGHT_X : P_GAP_X;

    booths.push({ code: `P${i}`, section: 'P', number: i, x, y, width: P_W, height: P_H });
  }

  return {
    viewBox: '0 50 5900 1600',
    booths,
    credit: 'Sơ đồ gốc bởi Color Fiesta',
    sectionLabels: [
      { section: 'A', x: 250, y: 355, fontSize: 80, color: '#f59e0b' },
      { section: 'B', x: 250, y: 705, fontSize: 80, color: '#3b82f6' },
      { section: 'C', x: 250, y: 1055, fontSize: 80, color: '#10b981' },
      { section: 'D', x: 250, y: 1405, fontSize: 80, color: '#ec4899' },
      { section: 'E', x: RIGHT_END + 80, y: 355, fontSize: 80, color: '#6366f1' },
      { section: 'F', x: RIGHT_END + 80, y: 705, fontSize: 80, color: '#ef4444' },
      { section: 'G', x: RIGHT_END + 80, y: 1055, fontSize: 80, color: '#059669' },
      { section: 'H', x: RIGHT_END + 80, y: 1405, fontSize: 80, color: '#f97316' },
      { section: 'P', x: 2760, y: 140, fontSize: 60, color: '#6b7280' },
      { section: 'P', x: P_RIGHT_X + 70, y: 140, fontSize: 60, color: '#6b7280' },
    ],
    sectionColors: {
      'A': { fill: '#fef3c7', stroke: '#f59e0b', hoverFill: '#fde68a', darkFill: '#78350f' },
      'B': { fill: '#dbeafe', stroke: '#3b82f6', hoverFill: '#bfdbfe', darkFill: '#1e3a5f' },
      'C': { fill: '#dcfce7', stroke: '#10b981', hoverFill: '#bbf7d0', darkFill: '#064e3b' },
      'D': { fill: '#fce7f3', stroke: '#ec4899', hoverFill: '#fbcfe8', darkFill: '#831843' },
      'E': { fill: '#e0e7ff', stroke: '#6366f1', hoverFill: '#c7d2fe', darkFill: '#312e81' },
      'F': { fill: '#fed7d7', stroke: '#ef4444', hoverFill: '#fecaca', darkFill: '#7f1d1d' },
      'G': { fill: '#d1fae5', stroke: '#059669', hoverFill: '#a7f3d0', darkFill: '#064e3b' },
      'H': { fill: '#fef2e2', stroke: '#f97316', hoverFill: '#fed7aa', darkFill: '#7c2d12' },
      'P': { fill: '#d1d5db', stroke: '#6b7280', hoverFill: '#e5e7eb', darkFill: '#374151' },
    },
  };
}
