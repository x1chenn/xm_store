import { cp, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import './check.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'catalog.js', 'assets']) {
  await cp(resolve(root, name), resolve(output, name), { recursive: true });
}
await writeFile(resolve(output, '.nojekyll'), '');
console.log('Build complete: dist/ — ready for any static website host.');
