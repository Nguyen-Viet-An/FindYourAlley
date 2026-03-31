import { BoothPosition } from '../floormap';

export interface SectionLabel {
  section: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

export interface SectionColor {
  fill: string;
  stroke: string;
  hoverFill: string;
  darkFill: string;
}

export interface FestivalLayout {
  viewBox: string;
  booths: BoothPosition[];
  sectionLabels: SectionLabel[];
  sectionColors: Record<string, SectionColor>;
  credit?: string;
}

export const DEFAULT_SECTION_COLOR: SectionColor = {
  fill: '#f3f4f6',
  stroke: '#6b7280',
  hoverFill: '#e5e7eb',
  darkFill: '#374151',
};
