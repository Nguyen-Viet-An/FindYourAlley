import { FestivalLayout } from './types';

export default function createLayout(): FestivalLayout {
  const booths: FestivalLayout['booths'] = [];

  // Section A (bottom) - 30 booths in 1 line
  for (let i = 1; i <= 30; i++) {
    booths.push({ code: `A${i}`, section: 'A', number: i, x: 900 + (i - 1) * 120, y: 2450, width: 110, height: 110 });
  }

  // Section P (bottom) - 9 booths in 1 line
  for (let i = 1; i <= 9; i++) {
    booths.push({ code: `P${i}`, section: 'P', number: i, x: 5500 + (i - 1) * 120, y: 2450, width: 110, height: 110 });
  }

  // Section B - 44 booths in 2 lines
  for (let i = 1; i <= 44; i++) {
    const x = i <= 22 ? 500 + (i - 1) * 120 : 500 + (i - 23) * 120;
    const y = i <= 22 ? 2100 : 1950;
    booths.push({ code: `B${i}`, section: 'B', number: i, x, y, width: 110, height: 110 });
  }

  // Section C - 44 booths in 2 lines
  for (let i = 1; i <= 44; i++) {
    const x = i <= 22 ? 500 + (i - 1) * 120 : 500 + (i - 23) * 120;
    const y = i <= 22 ? 1700 : 1550;
    booths.push({ code: `C${i}`, section: 'C', number: i, x, y, width: 110, height: 110 });
  }

  // Section D - 44 booths in 2 lines
  for (let i = 1; i <= 44; i++) {
    const x = i <= 22 ? 500 + (i - 1) * 120 : 500 + (i - 23) * 120;
    const y = i <= 22 ? 1300 : 1150;
    booths.push({ code: `D${i}`, section: 'D', number: i, x, y, width: 110, height: 110 });
  }

  // Section E - 44 booths in 2 lines
  for (let i = 1; i <= 44; i++) {
    const x = i <= 22 ? 500 + (i - 1) * 120 : 500 + (i - 23) * 120;
    const y = i <= 22 ? 900 : 750;
    booths.push({ code: `E${i}`, section: 'E', number: i, x, y, width: 110, height: 110 });
  }

  // Section F - 36 booths in 2 lines
  for (let i = 1; i <= 36; i++) {
    const x = i <= 18 ? 4650 + (i - 1) * 120 : 4650 + (i - 19) * 120;
    const y = i <= 18 ? 2100 : 1950;
    booths.push({ code: `F${i}`, section: 'F', number: i, x, y, width: 110, height: 110 });
  }

  // Section G - 36 booths in 2 lines
  for (let i = 1; i <= 36; i++) {
    const x = i <= 18 ? 4650 + (i - 1) * 120 : 4650 + (i - 19) * 120;
    const y = i <= 18 ? 1700 : 1550;
    booths.push({ code: `G${i}`, section: 'G', number: i, x, y, width: 110, height: 110 });
  }

  // Section H - 36 booths in 2 lines
  for (let i = 1; i <= 36; i++) {
    const x = i <= 18 ? 4650 + (i - 1) * 120 : 4650 + (i - 19) * 120;
    const y = i <= 18 ? 1300 : 1150;
    booths.push({ code: `H${i}`, section: 'H', number: i, x, y, width: 110, height: 110 });
  }

  // Section J - 36 booths in 2 lines
  for (let i = 1; i <= 36; i++) {
    const x = i <= 18 ? 4650 + (i - 1) * 120 : 4650 + (i - 19) * 120;
    const y = i <= 18 ? 900 : 750;
    booths.push({ code: `J${i}`, section: 'J', number: i, x, y, width: 110, height: 110 });
  }

  // Section K (top) - 56 booths in 1 line
  for (let i = 1; i <= 56; i++) {
    booths.push({ code: `K${i}`, section: 'K', number: i, x: 300 + (i - 1) * 120, y: 400, width: 110, height: 110 });
  }

  return {
    viewBox: '0 0 7100 2700',
    booths,
    sectionLabels: [
      { section: 'A', x: 800, y: 2520, fontSize: 80, color: '#f59e0b' },
      { section: 'P', x: 5400, y: 2520, fontSize: 80, color: '#6b7280' },
      { section: 'B', x: 350, y: 2110, fontSize: 80, color: '#3b82f6' },
      { section: 'C', x: 350, y: 1710, fontSize: 80, color: '#10b981' },
      { section: 'D', x: 350, y: 1310, fontSize: 80, color: '#ec4899' },
      { section: 'E', x: 350, y: 910, fontSize: 80, color: '#6366f1' },
      { section: 'F', x: 4500, y: 2110, fontSize: 80, color: '#ef4444' },
      { section: 'G', x: 4500, y: 1710, fontSize: 80, color: '#059669' },
      { section: 'H', x: 4500, y: 1310, fontSize: 80, color: '#f97316' },
      { section: 'J', x: 4500, y: 910, fontSize: 80, color: '#8b5cf6' },
      { section: 'K', x: 4000, y: 300, fontSize: 80, color: '#d946ef' },
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
      'J': { fill: '#f3e8ff', stroke: '#8b5cf6', hoverFill: '#e9d5ff', darkFill: '#4c1d95' },
      'K': { fill: '#fdf2f8', stroke: '#d946ef', hoverFill: '#f5d0fe', darkFill: '#701a75' },
      'P': { fill: '#d1d5db', stroke: '#6b7280', hoverFill: '#e5e7eb', darkFill: '#374151' },
    },
  };
}
