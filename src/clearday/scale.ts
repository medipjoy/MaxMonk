import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 375;

export function moderateScale(size: number, factor = 0.5): number {
  return size + (width / BASE_WIDTH - 1) * size * factor;
}

export const isTablet = width >= 768;
export const isWeb = Platform.OS === 'web';
export const isWide = width >= 768;
export const isMobile = !isWide;

// For dynamic screen dimensions
export function getWindowDimensions() {
  return {
    width,
    height,
    isWide,
    isMobile,
    isWeb,
    isTablet,
  };
}

// SVG icon helpers
export function createCrosshair(size: number, strokeWidth: number = 2, color: string = '#000000'): string {
  const center = size / 2;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${0}" y1="${center}" x2="${size}" y2="${center}" stroke="${color}" stroke-width="${strokeWidth}"/>
    <line x1="${center}" y1="${0}" x2="${center}" y2="${size}" stroke="${color}" stroke-width="${strokeWidth}"/>
  </svg>`;
}

export function createListIcon(size: number, strokeWidth: number = 2, color: string = '#000000'): string {
  const gap = size / 4;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <line x1="${gap}" y1="${gap}" x2="${size - gap}" y2="${gap}" stroke="${color}" stroke-width="${strokeWidth}"/>
    <line x1="${gap}" y1="${gap * 2}" x2="${size - gap}" y2="${gap * 2}" stroke="${color}" stroke-width="${strokeWidth}"/>
    <line x1="${gap}" y1="${gap * 3}" x2="${size - gap}" y2="${gap * 3}" stroke="${color}" stroke-width="${strokeWidth}"/>
  </svg>`;
}

export function createDotsIcon(size: number, dotRadius: number = 1.5, color: string = '#000000'): string {
  const gap = size / 4;
  const cx1 = gap;
  const cx2 = size / 2;
  const cx3 = size - gap;
  const cy = size / 2;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx1}" cy="${cy}" r="${dotRadius}" fill="${color}"/>
    <circle cx="${cx2}" cy="${cy}" r="${dotRadius}" fill="${color}"/>
    <circle cx="${cx3}" cy="${cy}" r="${dotRadius}" fill="${color}"/>
  </svg>`;
}

export function createArrowIcon(direction: 'left' | 'right', size: number, strokeWidth: number = 2, color: string = '#000000'): string {
  const padding = size / 4;
  if (direction === 'left') {
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${size - padding}" y1="${padding}" x2="${padding}" y2="${size / 2}" stroke="${color}" stroke-width="${strokeWidth}"/>
      <line x1="${padding}" y1="${size / 2}" x2="${size - padding}" y2="${size - padding}" stroke="${color}" stroke-width="${strokeWidth}"/>
    </svg>`;
  } else {
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${padding}" y1="${padding}" x2="${size - padding}" y2="${size / 2}" stroke="${color}" stroke-width="${strokeWidth}"/>
      <line x1="${size - padding}" y1="${size / 2}" x2="${padding}" y2="${size - padding}" stroke="${color}" stroke-width="${strokeWidth}"/>
    </svg>`;
  }
}

export function createStarIcon(size: number, fill: boolean = false, strokeWidth: number = 1.5, color: string = '#000000'): string {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2.5;
  const innerRadius = outerRadius * 0.4;

  // Generate 5-point star points
  const points: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }

  const pointsStr = points.map(([x, y]) => `${x},${y}`).join(' ');
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="${pointsStr}" fill="${fill ? color : 'none'}" stroke="${color}" stroke-width="${strokeWidth}"/>
  </svg>`;
}
