import { ParsedBooth } from '@/types';

/**
 * Enhanced booth code parsing that handles various formats and positions
 * Supports booth codes at beginning, middle, or end of title
 *
 * Supported formats:
 * - A1, A12, B34
 * - A13-14, A13-A14, A13 - A14
 * - A13,14, A13, 14, A13, A14
 * - Multiple codes: A1, A2, A3
 * - Ranges with different sections: A13-B14 (treated as individual codes)
 *
 * Examples:
 * "A1 - Coffee Shop" -> { label: "A1", codes: ["A1"], boothName: "Coffee Shop" }
 * "Big Event at A12-13" -> { label: "A12-13", codes: ["A12", "A13"], boothName: "Big Event" }
 * "Coffee A1, A2 Special" -> { label: "A1, A2", codes: ["A1", "A2"], boothName: "Coffee Special" }
 */
export function parseBooth(title: string): ParsedBooth | null {
  if (!title?.trim()) return null;

  const cleanTitle = title.trim();
  const result = extractBoothCodes(cleanTitle);

  if (!result || result.codes.length === 0) {
    return null;
  }

  return result;
}

/**
 * Extract booth codes from anywhere in the title
 */
function extractBoothCodes(title: string): ParsedBooth | null {
  // Enhanced patterns to match booth codes in various formats
  const patterns = [
    // Pattern 1: Booth codes at the beginning with dash separator
    // A1 - Title, A12-13 - Title, A1,2 - Title, K25,26 - Title, E1,2 - Title
    /^([A-Z]{0,2}\d{1,2}(?:[-,\s]*(?:[A-Z]{0,2})?\d{1,2})*)\s*[-–—]\s*(.+)$/i,

    // Pattern 2: Booth codes at the beginning with colon
    // G13-14: Rình Ai Tắm
    /^([A-Z]{1,2}\d{1,2}(?:-\d{1,2})?)\s*:\s*(.+)$/i,

    // Pattern 3: Booth range codes at the beginning with space (compact format)
    // D25-26 Túi rác, B5-6 3 Ngọn Nến, G17-18 0 Sanity
    /^([A-Z]{1,2}\d{1,2}-\d{1,2})\s+(.+)$/i,

    // Pattern 4: Comma-separated booth codes at the beginning
    // K25,26 Title, E1,2 Title, A7,8 Title
    /^([A-Z]{1,2}\d{1,2},\s*\d{1,2})\s+(.+)$/i,

    // Pattern 5: General booth codes at the beginning with space
    // A1 Title, B12 Something
    /^([A-Z]{0,2}\d{1,2}(?:[-,\s]*(?:[A-Z]{0,2})?\d{1,2})*)\s+(.+)$/i,

    // Pattern 6: Booth codes in parentheses anywhere
    // Title (A1), Title (A12-13), Title (A1, A2)
    /^(.+?)\s*\(([A-Z]{0,2}\d{1,2}(?:[-,\s]*(?:[A-Z]{0,2})?\d{1,2})*)\)(.*)$/i,

    // Pattern 7: Booth codes at the end without parentheses
    // Title A1, Title A12-13, Title A1, A2
    /^(.+?)\s+([A-Z]{0,2}\d{1,2}(?:[-,\s]*(?:[A-Z]{0,2})?\d{1,2})*)$/i,

    // Pattern 8: Booth codes in the middle with "at" or "booth"
    // Event at A1, Event booth A12-13
    /^(.+?)\s+(?:at|booth)\s+([A-Z]{0,2}\d{1,2}(?:[-,\s]*(?:[A-Z]{0,2})?\d{1,2})*)\s*(.*)$/i,

    // Pattern 9: Just booth codes (no other text)
    // A1, A12-13, A1, A2
    /^([A-Z]{0,2}\d{1,2}(?:[-,\s]*(?:[A-Z]{0,2})?\d{1,2})*)$/i
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      let boothCodeStr: string;
      let boothName: string;

      if (pattern === patterns[0]) {
        // Pattern 1: codes at beginning with dash
        boothCodeStr = match[1];
        boothName = match[2]?.trim() || '';
      } else if (pattern === patterns[1]) {
        // Pattern 2: codes at beginning with colon
        boothCodeStr = match[1];
        boothName = match[2]?.trim() || '';
      } else if (pattern === patterns[2]) {
        // Pattern 3: codes at beginning with space (compact range format)
        boothCodeStr = match[1];
        boothName = match[2]?.trim() || '';
      } else if (pattern === patterns[3]) {
        // Pattern 4: codes at beginning (compact comma format)
        boothCodeStr = match[1];
        boothName = match[2]?.trim() || '';
      } else if (pattern === patterns[4]) {
        // Pattern 5: codes at beginning with space (general)
        boothCodeStr = match[1];
        boothName = match[2]?.trim() || '';
      } else if (pattern === patterns[5]) {
        // Pattern 6: codes in parentheses
        boothCodeStr = match[2];
        boothName = (match[1] + ' ' + (match[3] || '')).trim();
      } else if (pattern === patterns[6]) {
        // Pattern 7: codes at end
        boothCodeStr = match[2];
        boothName = match[1]?.trim() || '';
      } else if (pattern === patterns[7]) {
        // Pattern 8: codes in middle with "at/booth"
        boothCodeStr = match[2];
        boothName = (match[1] + ' ' + (match[3] || '')).trim();
      } else {
        // Pattern 9: just codes
        boothCodeStr = match[1];
        boothName = '';
      }

      const codes = parseBoothCodeString(boothCodeStr);
      if (codes.length > 0) {
        return {
          label: boothCodeStr.toUpperCase(),
          codes: codes,
          boothName: boothName
        };
      }
    }
  }

  return null;
}

/**
 * Parse a string of booth codes into individual codes
 * Handles: A1, A12-13, A1,A2, A1, A2, A13 - A14, K25,26, E1,2, etc.
 */
function parseBoothCodeString(codeStr: string): string[] {
  if (!codeStr) return [];

  const codes: string[] = [];

  // First, handle special cases like "K25,26", "E1,2" where section is only mentioned once
  const compactPattern = /^([A-Z]+)(\d+),\s*(\d+)$/;
  const compactMatch = codeStr.trim().match(compactPattern);

  if (compactMatch) {
    const section = compactMatch[1];
    const num1 = compactMatch[2];
    const num2 = compactMatch[3];
    codes.push(section + num1, section + num2);
    return codes.sort(sortBoothCodes);
  }

  // Handle ranges like "K25-26", "D25-26" where section is only mentioned once
  const compactRangePattern = /^([A-Z]+)(\d+)-(\d+)$/;
  const compactRangeMatch = codeStr.trim().match(compactRangePattern);

  if (compactRangeMatch) {
    const section = compactRangeMatch[1];
    const start = parseInt(compactRangeMatch[2], 10);
    const end = parseInt(compactRangeMatch[3], 10);

    if (start <= end && (end - start) <= 10) { // reasonable range
      for (let n = start; n <= end; n++) {
        codes.push(section + n);
      }
      return codes.sort(sortBoothCodes);
    }
  }

  // Handle cases like "G19, 20" where the comma-separated part might end with a dash and title
  // Split on dash first to separate booth codes from title
  const dashSplit = codeStr.split(/[-–—](?=\s*[A-Za-z])/);
  let actualCodeStr = dashSplit[0].trim();

  // Use the part before any dash that's followed by letters (title)
  if (dashSplit.length > 1) {
    codeStr = actualCodeStr;
  }

  // Split by commas and semicolons to handle multiple codes
  const parts = codeStr.split(/[,;]/).map(part => part.trim());

  for (const part of parts) {
    if (!part) continue;

    // Check if this part contains a range (with dash/hyphen)
    if (part.includes('-') || part.includes('–') || part.includes('—')) {
      const rangeCodes = parseBoothRange(part);
      codes.push(...rangeCodes);
    } else {
      // Single booth code - handle cases like "26" (from "G19, 20")
      const normalized = normalizeBoothCode(part);
      if (normalized) {
        codes.push(normalized);
      } else if (/^\d+$/.test(part) && codes.length > 0) {
        // If it's just a number and we have previous codes, inherit the section
        const lastCode = codes[codes.length - 1];
        const lastSection = lastCode.match(/^[A-Z]*/)?.[0] || '';
        if (lastSection) {
          codes.push(lastSection + part);
        }
      }
    }
  }

  // Remove duplicates and sort
  return [...new Set(codes)].sort(sortBoothCodes);
}

/**
 * Sort booth codes by section letter first, then by number
 */
function sortBoothCodes(a: string, b: string): number {
  const aSection = a.match(/^[A-Z]*/)?.[0] || '';
  const bSection = b.match(/^[A-Z]*/)?.[0] || '';
  const aNum = parseInt(a.replace(/^[A-Z]*/, ''), 10);
  const bNum = parseInt(b.replace(/^[A-Z]*/, ''), 10);

  if (aSection !== bSection) {
    return aSection.localeCompare(bSection);
  }
  return aNum - bNum;
}

/**
 * Parse a booth code range like "A12-13", "A12-A14", "12-14"
 */
function parseBoothRange(rangeStr: string): string[] {
  const codes: string[] = [];

  // Split on various dash types
  const rangeParts = rangeStr.split(/[-–—]/).map(part => part.trim());

  if (rangeParts.length !== 2) {
    // Invalid range, treat as single code
    const normalized = normalizeBoothCode(rangeStr);
    return normalized ? [normalized] : [];
  }

  const [startStr, endStr] = rangeParts;

  // Extract section letters and numbers
  const startMatch = startStr.match(/^([A-Z]*)(\d+)$/i);
  const endMatch = endStr.match(/^([A-Z]*)(\d+)$/i);

  if (!startMatch || !endMatch) {
    // Invalid format, treat as individual codes
    const startNorm = normalizeBoothCode(startStr);
    const endNorm = normalizeBoothCode(endStr);
    if (startNorm) codes.push(startNorm);
    if (endNorm && endNorm !== startNorm) codes.push(endNorm);
    return codes;
  }

  const startSection = startMatch[1].toUpperCase() || '';
  const startNum = parseInt(startMatch[2], 10);
  const endSection = endMatch[1].toUpperCase() || startSection; // Use start section if end has no section
  const endNum = parseInt(endMatch[2], 10);

  // Only create range if same section and reasonable range size
  if (startSection === endSection && startNum <= endNum && (endNum - startNum) <= 15) {
    for (let n = startNum; n <= endNum; n++) {
      codes.push(startSection + n);
    }
  } else {
    // Different sections or too large range, treat as individual codes
    codes.push(startSection + startNum);
    codes.push(endSection + endNum);
  }

  return codes;
}

/**
 * Normalize a single booth code to standard format
 */
function normalizeBoothCode(code: string): string | null {
  if (!code) return null;

  const match = code.trim().match(/^([A-Z]*)(\d+)$/i);
  if (!match) return null;

  const section = match[1].toUpperCase();
  const number = parseInt(match[2], 10);

  if (isNaN(number) || number < 1 || number > 999) {
    return null;
  }

  return section + number;
}

/**
 * Validate booth code format
 */
export function isValidBoothCode(code: string): boolean {
  return /^[A-Z]{0,2}\d{1,3}$/.test(code.toUpperCase());
}

/**
 * Extract all possible booth codes from a title (exported version)
 */
export function extractAllBoothCodes(title: string): string[] {
  const parsed = parseBooth(title);
  return parsed ? parsed.codes : [];
}
