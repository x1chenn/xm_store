import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products, looks, storePhotos, categoryNames } from '../catalog.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'miniprogram/data'), { recursive: true });
await writeFile(resolve(root, 'miniprogram/data/catalog.js'), '// Generated from the website catalog. Run npm run mini:sync after updating catalog.js.\nmodule.exports = ' + JSON.stringify({ products, looks, storePhotos, categoryNames }, null, 2) + ';\n');
console.log(`Mini program catalog updated: ${products.length} products, ${storePhotos.length} store photos.`);
