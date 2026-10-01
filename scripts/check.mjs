import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, looks, storePhotos, categoryNames } from '../catalog.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ids = new Set();
const photos = new Set();
for (const product of products) {
  assert(!ids.has(product.id), `Duplicate product: ${product.id}`);
  ids.add(product.id);
  assert(categoryNames[product.category], `Unknown category: ${product.category}`);
  assert(product.name && product.description && product.variants.length > 0, `Incomplete product: ${product.id}`);
  assert(product.price === null || (typeof product.price === 'number' && product.price >= 0), `Invalid price: ${product.id}`);
  for (const variant of product.variants) {
    assert(variant.color && /^#[0-9a-f]{6}$/i.test(variant.hex) && variant.images.length, `Invalid variant: ${product.id}`);
    variant.images.forEach((file) => photos.add(file));
  }
}
Object.values(looks).forEach((look) => look.images.forEach((file) => photos.add(file)));
storePhotos.forEach((photo) => photos.add(photo.file));
for (const photo of photos) await access(resolve(root, 'assets', 'images', photo));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
for (const anchor of anchors) assert(html.includes(`id="${anchor}"`), `Missing anchor: ${anchor}`);
for (const [, relative] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) await access(resolve(root, relative));
console.log(`Content checks passed: ${products.length} products, ${photos.size} photos, all assets and navigation targets exist.`);
