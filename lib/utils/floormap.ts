export interface BoothPosition {
  code: string;
  section: string;
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  group?: string;
}

/**
 * Parse the XML floor map to extract booth positions
 */
export function parseFloorMapXML(xmlContent: string): BoothPosition[] {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  const booths: BoothPosition[] = [];
  const cells = doc.getElementsByTagName('mxCell');

  // Track groups to determine sections
  const groupElements = new Map<string, { x: number, y: number }>();

  // First pass: collect group information
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const style = cell.getAttribute('style') || '';
    const id = cell.getAttribute('id') || '';

    if (style.includes('group')) {
      const geometry = findGeometry(cell, doc);
      if (geometry) {
        groupElements.set(id, {
          x: parseFloat(geometry.getAttribute('x') || '0'),
          y: parseFloat(geometry.getAttribute('y') || '0')
        });
      }
    }
  }

  // Second pass: extract booth numbers and positions
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    const value = cell.getAttribute('value') || '';
    const parent = cell.getAttribute('parent') || '';

    // Look for numbered text elements
    const numberMatch = value.match(/>(\d+)</);
    if (numberMatch) {
      const number = parseInt(numberMatch[1]);
      const geometry = findGeometry(cell, doc);

      if (geometry) {
        const x = parseFloat(geometry.getAttribute('x') || '0');
        const y = parseFloat(geometry.getAttribute('y') || '0');
        const width = parseFloat(geometry.getAttribute('width') || '70');
        const height = parseFloat(geometry.getAttribute('height') || '70');

        // Determine section based on group/position
        const section = determineSectionFromPosition(x, y, groupElements, parent);

        booths.push({
          code: `${section}${number}`,
          section,
          number,
          x,
          y,
          width,
          height,
          group: parent
        });
      }
    }
  }

  return booths.sort((a, b) => {
    if (a.section === b.section) {
      return a.number - b.number;
    }
    return a.section.localeCompare(b.section);
  });
}

/**
 * Find geometry element for a cell
 */
function findGeometry(cell: Element, doc: Document): Element | null {
  // Look for mxGeometry in this cell
  const geometries = cell.getElementsByTagName('mxGeometry');
  if (geometries.length > 0) {
    return geometries[0];
  }

  // Look in child elements
  const children = cell.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as Element;
    if (child.nodeType === 1) { // Element node
      const geom = findGeometry(child, doc);
      if (geom) return geom;
    }
  }

  return null;
}

/**
 * Determine section letter based on position and group
 */
function determineSectionFromPosition(
  x: number,
  y: number,
  groups: Map<string, { x: number, y: number }>,
  parentId: string
): string {
  // Based on the floor layout from your screenshot
  // This is a rough mapping - you may need to adjust based on your actual coordinates

  if (y > 2000) return 'A'; // Bottom section
  if (x < 500) {
    if (y < 500) return 'E';
    if (y < 1000) return 'D';
    if (y < 1500) return 'C';
    return 'B';
  }
  if (x > 1500) {
    if (y < 500) return 'J';
    if (y < 1000) return 'H';
    if (y < 1500) return 'G';
    return 'F';
  }
  if (y < 200) return 'K'; // Top section

  // Fallback to group-based detection
  const groupPos = groups.get(parentId);
  if (groupPos) {
    if (groupPos.y > 2000) return 'A';
    if (groupPos.x < 500) return 'B';
    if (groupPos.x > 1500) return 'F';
    if (groupPos.y < 200) return 'K';
  }

  return 'A'; // Default fallback
}

/**
 * Convert XML coordinates to SVG viewBox coordinates
 */
export function convertToSVGCoordinates(
  booth: BoothPosition,
  xmlBounds: { width: number, height: number },
  svgViewBox: { width: number, height: number }
): BoothPosition {
  const scaleX = svgViewBox.width / xmlBounds.width;
  const scaleY = svgViewBox.height / xmlBounds.height;

  return {
    ...booth,
    x: booth.x * scaleX,
    y: booth.y * scaleY,
    width: booth.width * scaleX,
    height: booth.height * scaleY
  };
}
