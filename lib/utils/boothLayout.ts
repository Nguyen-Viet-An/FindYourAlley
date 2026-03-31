import { FestivalLayout } from './layouts/types';
import cofi15 from './layouts/cofi15';
import cofi16 from './layouts/cofi16';

// Register festival layouts here — add one import + one entry per festival
const layoutRegistry: Record<string, () => FestivalLayout> = {
  COFI15: cofi15,
  COFI16: cofi16,
};

const DEFAULT_FESTIVAL = 'COFI15';

export function getFestivalLayout(festivalCode?: string): FestivalLayout {
  const key = (festivalCode ?? DEFAULT_FESTIVAL).toUpperCase();
  const factory = layoutRegistry[key] ?? layoutRegistry[DEFAULT_FESTIVAL];
  return factory();
}

export function hasRegisteredLayout(festivalCode?: string): boolean {
  if (!festivalCode) return false;
  return festivalCode.toUpperCase() in layoutRegistry;
}

// Re-export types for convenience
export type { FestivalLayout, SectionLabel, SectionColor } from './layouts/types';
export { DEFAULT_SECTION_COLOR } from './layouts/types';