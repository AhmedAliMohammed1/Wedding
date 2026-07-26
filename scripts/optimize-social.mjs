import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const source = process.argv[2];
if (!source) {
  throw new Error('Pass the generated social image path as the first argument.');
}

const output = join(process.cwd(), 'public', 'assets', 'images', 'social-preview-generated.webp');
await mkdir(dirname(output), { recursive: true });
await sharp(source)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .webp({ quality: 86, effort: 6 })
  .toFile(output);

console.log(`Saved optimized social preview to ${output}`);
