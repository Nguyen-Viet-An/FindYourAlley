import { BoothPosition } from './floormap';

/**
 * Generate booth positions based on the floor plan structure
 * This creates a simplified grid layout representing the actual floor map
 */
export function generateBoothLayout(): BoothPosition[] {
  const booths: BoothPosition[] = [];

  // Section A (bottom) - 30 booths in 1 line
  for (let i = 1; i <= 30; i++) {
    booths.push({
      code: `A${i}`,
      section: 'A',
      number: i,
      x: 900 + (i - 1) * 120,
      y: 2450,
      width: 110,
      height: 110
    });
  }

  // Section B (left side) - 44 booths in 2 lines
  // Bottom line: 1-22, Top line: 23-44 (facing each other)
  for (let i = 1; i <= 44; i++) {
    let x, y;
    if (i <= 22) {
      // Bottom line (1-22)
      x = 500 + (i - 1) * 120;
      y = 2100;
    } else {
      // Top line (23-44), same column as corresponding bottom booth
      x = 500 + (i - 23) * 120;
      y = 1950;
    }
    booths.push({
      code: `B${i}`,
      section: 'B',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section C (left side) - 44 booths in 2 lines
  // Bottom line: 1-22, Top line: 23-44 (facing each other)
  for (let i = 1; i <= 44; i++) {
    let x, y;
    if (i <= 22) {
      // Bottom line (1-22)
      x = 500 + (i - 1) * 120;
      y = 1700;
    } else {
      // Top line (23-44), same column as corresponding bottom booth
      x = 500 + (i - 23) * 120;
      y = 1550;
    }
    booths.push({
      code: `C${i}`,
      section: 'C',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section D (left side) - 44 booths in 2 lines
  // Bottom line: 1-22, Top line: 23-44 (facing each other)
  for (let i = 1; i <= 44; i++) {
    let x, y;
    if (i <= 22) {
      // Bottom line (1-22)
      x = 500 + (i - 1) * 120;
      y = 1300;
    } else {
      // Top line (23-44), same column as corresponding bottom booth
      x = 500 + (i - 23) * 120;
      y = 1150;
    }
    booths.push({
      code: `D${i}`,
      section: 'D',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section E (left side) - 44 booths in 2 lines
  // Bottom line: 1-22, Top line: 23-44 (facing each other)
  for (let i = 1; i <= 44; i++) {
    let x, y;
    if (i <= 22) {
      // Bottom line (1-22)
      x = 500 + (i - 1) * 120;
      y = 900;
    } else {
      // Top line (23-44), same column as corresponding bottom booth
      x = 500 + (i - 23) * 120;
      y = 750;
    }
    booths.push({
      code: `E${i}`,
      section: 'E',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section F (right side) - 36 booths in 2 lines
  // Bottom line: 1-18, Top line: 19-36 (facing each other)
  for (let i = 1; i <= 36; i++) {
    let x, y;
    if (i <= 18) {
      // Bottom line (1-18)
      x = 4650 + (i - 1) * 120;
      y = 2100;
    } else {
      // Top line (19-36), same column as corresponding bottom booth
      x = 4650 + (i - 19) * 120;
      y = 1950;
    }
    booths.push({
      code: `F${i}`,
      section: 'F',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section G (right side) - 36 booths in 2 lines
  // Bottom line: 1-18, Top line: 19-36 (facing each other)
  for (let i = 1; i <= 36; i++) {
    let x, y;
    if (i <= 18) {
      // Bottom line (1-18)
      x = 4650 + (i - 1) * 120;
      y = 1700;
    } else {
      // Top line (19-36), same column as corresponding bottom booth
      x = 4650 + (i - 19) * 120;
      y = 1550;
    }
    booths.push({
      code: `G${i}`,
      section: 'G',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section H (right side) - 36 booths in 2 lines
  // Bottom line: 1-18, Top line: 19-36 (facing each other)
  for (let i = 1; i <= 36; i++) {
    let x, y;
    if (i <= 18) {
      // Bottom line (1-18)
      x = 4650 + (i - 1) * 120;
      y = 1300;
    } else {
      // Top line (19-36), same column as corresponding bottom booth
      x = 4650 + (i - 19) * 120;
      y = 1150;
    }
    booths.push({
      code: `H${i}`,
      section: 'H',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section J (right side) - 36 booths in 2 lines
  // Bottom line: 1-18, Top line: 19-36 (facing each other)
  for (let i = 1; i <= 36; i++) {
    let x, y;
    if (i <= 18) {
      // Bottom line (1-18)
      x = 4650 + (i - 1) * 120;
      y = 900;
    } else {
      // Top line (19-36), same column as corresponding bottom booth
      x = 4650 + (i - 19) * 120;
      y = 750;
    }
    booths.push({
      code: `J${i}`,
      section: 'J',
      number: i,
      x: x,
      y: y,
      width: 110,
      height: 110
    });
  }

  // Section K (top) - 56 booths in 1 line
  for (let i = 1; i <= 56; i++) {
    booths.push({
      code: `K${i}`,
      section: 'K',
      number: i,
      x: 300 + (i - 1) * 120,
      y: 400,
      width: 110,
      height: 110
    });
  }

  return booths;
}
