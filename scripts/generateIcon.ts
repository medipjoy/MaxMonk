import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CANVAS_SIZE = 1024;
const BG_COLOR = '#F8F7F4';
const LINE_COLOR = '#C8C2BB';
const GOLD_COLOR = '#8A6A14';

async function createIconSVG(size: number, includeConcentric: boolean = true): Promise<Buffer> {
  const strokeWidth = 3;
  const margin = 120;
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = 180;
  const midRadius = 110;
  const innerRadius = 48;
  const goldRadius = 28;

  let svgContent = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${BG_COLOR}"/>`;

  if (includeConcentric) {
    // Concentric circles (stroke only)
    svgContent += `
    <circle cx="${centerX}" cy="${centerY}" r="${outerRadius}" stroke="${LINE_COLOR}" stroke-width="2.5" fill="none"/>
    <circle cx="${centerX}" cy="${centerY}" r="${midRadius}" stroke="${LINE_COLOR}" stroke-width="2.5" fill="none"/>
    <circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" stroke="${LINE_COLOR}" stroke-width="2.5" fill="none"/>`;
  }

  // Horizontal line (crosshair)
  svgContent += `
    <line x1="${margin}" y1="${centerY}" x2="${size - margin}" y2="${centerY}" stroke="${LINE_COLOR}" stroke-width="${strokeWidth}"/>`;

  // Vertical line (crosshair)
  svgContent += `
    <line x1="${centerX}" y1="${margin}" x2="${centerX}" y2="${size - margin}" stroke="${LINE_COLOR}" stroke-width="${strokeWidth}"/>`;

  // Gold inner circle (filled)
  svgContent += `
    <circle cx="${centerX}" cy="${centerY}" r="${goldRadius}" fill="${GOLD_COLOR}"/>
  </svg>`;

  return Buffer.from(svgContent);
}

async function generateIcons() {
  const assetsDir = path.join(__dirname, '../assets');

  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  try {
    console.log('🎨 Generating app icons...');

    // Main icon (1024x1024)
    console.log('  → icon.png (1024x1024)');
    const icon1024SVG = await createIconSVG(CANVAS_SIZE, true);
    await sharp(icon1024SVG)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));

    // Adaptive icon (512x512)
    console.log('  → adaptive-icon.png (512x512)');
    const icon512SVG = await createIconSVG(512, true);
    await sharp(icon512SVG)
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));

    // Favicon (64x64, simplified without concentric rings)
    console.log('  → favicon.png (64x64)');
    const faviconSVG = await createIconSVG(64, false);
    await sharp(faviconSVG)
      .resize(64, 64)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));

    console.log('✅ Icons generated successfully!');
    console.log(`   Assets saved to: ${assetsDir}`);
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
