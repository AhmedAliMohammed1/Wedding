import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const imageDir = join(process.cwd(), 'public', 'assets', 'images');
await mkdir(imageDir, { recursive: true });

const palettes = [
  ['#253428', '#52604A', '#D6C2A6', '#F5EBDD'],
  ['#314237', '#78846C', '#C9A9A6', '#F7F2E8'],
  ['#4C5447', '#9C8B78', '#E8DED0', '#C6A29C'],
  ['#1F2C25', '#5D6B58', '#C3A58F', '#F2E8DA'],
  ['#3A463A', '#83949B', '#E2CFC5', '#F7F2E8'],
  ['#28352F', '#667360', '#BFA7A5', '#D7C9B8']
];

const botanicalSvg = ({ width, height, palette, variant = 0, title = '' }) => {
  const [deep, mid, accent, light] = palette;
  const petals = Array.from({ length: 18 }, (_, index) => {
    const x = ((index * 193 + variant * 71) % width) - 80;
    const y = ((index * 337 + variant * 43) % height) - 50;
    const rotate = (index * 47 + variant * 23) % 180;
    const scale = 0.6 + ((index * 13) % 8) / 10;
    return `<ellipse cx="${x}" cy="${y}" rx="${42 * scale}" ry="${100 * scale}" transform="rotate(${rotate} ${x} ${y})" fill="${index % 3 === 0 ? accent : mid}" opacity="${0.08 + (index % 4) * 0.025}"/>`;
  }).join('');
  const leaves = Array.from({ length: 15 }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side === -1 ? -50 + index * 10 : width + 50 - index * 9;
    const y = (index * 137 + variant * 89) % height;
    const rotation = side === -1 ? -35 + index * 9 : 215 - index * 7;
    return `<g transform="translate(${x} ${y}) rotate(${rotation})" opacity="${0.24 + (index % 3) * 0.08}">
      <path d="M0 0 C80 -120 190 -105 210 -15 C135 25 70 26 0 0Z" fill="${index % 4 === 0 ? accent : mid}"/>
      <path d="M5 0 C80 -18 138 -20 200 -15" fill="none" stroke="${light}" stroke-opacity=".25" stroke-width="3"/>
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <radialGradient id="glow" cx="${35 + variant * 7}%" cy="${22 + variant * 5}%" r="80%">
        <stop offset="0" stop-color="${light}"/>
        <stop offset=".38" stop-color="${accent}"/>
        <stop offset="1" stop-color="${deep}"/>
      </radialGradient>
      <linearGradient id="veil" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="${light}" stop-opacity=".08"/>
        <stop offset=".48" stop-color="${deep}" stop-opacity=".08"/>
        <stop offset="1" stop-color="#0b140e" stop-opacity=".46"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="${Math.max(width, height) * 0.035}"/></filter>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#glow)"/>
    <circle cx="${width * 0.72}" cy="${height * 0.28}" r="${width * 0.28}" fill="${light}" opacity=".14" filter="url(#blur)"/>
    <circle cx="${width * 0.28}" cy="${height * 0.66}" r="${width * 0.36}" fill="${mid}" opacity=".24" filter="url(#blur)"/>
    ${petals}
    ${leaves}
    <rect width="100%" height="100%" fill="url(#veil)"/>
    <rect width="100%" height="100%" filter="url(#grain)" opacity=".035"/>
    ${title ? `<text x="50%" y="50%" text-anchor="middle" fill="${light}" font-family="Georgia,serif" font-size="${width * 0.07}" letter-spacing="8">${title}</text>` : ''}
  </svg>`;
};

const jobs = [
  { name: 'hero-garden.webp', width: 1920, height: 1280, palette: palettes[0], variant: 1, quality: 84 },
  { name: 'story-main.webp', width: 1200, height: 1500, palette: palettes[1], variant: 2, quality: 82 },
  { name: 'story-secondary.webp', width: 900, height: 1100, palette: palettes[2], variant: 3, quality: 82 },
  { name: 'venue-garden.webp', width: 1400, height: 1000, palette: palettes[3], variant: 4, quality: 82 },
  ...palettes.map((palette, index) => ({
    name: `gallery-${String(index + 1).padStart(2, '0')}.webp`,
    width: 1200,
    height: 1500,
    palette,
    variant: index + 5,
    quality: 80
  }))
];

for (const job of jobs) {
  const svg = botanicalSvg(job);
  await sharp(Buffer.from(svg)).webp({ quality: job.quality, effort: 5 }).toFile(join(imageDir, job.name));
}

console.log(`Generated ${jobs.length} image placeholders.`);
