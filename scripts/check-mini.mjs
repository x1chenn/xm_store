import assert from 'node:assert/strict';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { products, looks, storePhotos, categoryNames } from '../catalog.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'miniprogram');
const catalog = { products, looks, storePhotos, categoryNames };
const sourceCatalog = await readFile(resolve(root, 'data/catalog.js'), 'utf8');
const catalogModule = { exports: {} };
new Script(sourceCatalog).runInNewContext({ module: catalogModule });
assert.equal(JSON.stringify(catalogModule.exports), JSON.stringify(catalog), 'Run npm run mini:sync to update the catalog.');
const calls = [];
const wx = new Proxy({}, { get: (_, name) => (options) => calls.push({ name, ...options }) });
const helperModule = { exports: {} };
new Script(await readFile(resolve(root, 'utils/store.js'), 'utf8')).runInNewContext({ module: helperModule, require: () => catalog, wx });
const helpers = helperModule.exports;
const app = JSON.parse(await readFile(resolve(root, 'app.json'), 'utf8'));
let totalBytes = 0;
async function files(directory) {
  for (const file of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, file.name);
    if (file.isDirectory()) await files(path);
    else {
      totalBytes += (await stat(path)).size;
      if (extname(path) === '.js') new Script(await readFile(path, 'utf8'), { filename: path });
    }
  }
}
await files(root);
assert(totalBytes < 2 * 1024 * 1024, `Mini program package is too large: ${totalBytes} bytes.`);
for (const pagePath of app.pages) {
  for (const extension of ['js', 'wxml', 'wxss']) await access(resolve(root, `${pagePath}.${extension}`));
  const wxml = await readFile(resolve(root, `${pagePath}.wxml`), 'utf8');
  assert(!/<\/?(?:div|span|br|img|a)\b/.test(wxml), `HTML elements found in WXML: ${pagePath}`);
}
for (const tab of app.tabBar.list) assert(app.pages.includes(tab.pagePath));
const photos = new Set([
  ...products.flatMap(product => product.variants.flatMap(variant => variant.images)),
  ...Object.values(looks).flatMap(look => look.images), ...storePhotos.map(photo => photo.file)
]);
for (const photo of photos) await access(resolve(root, 'assets/images', photo));
async function loadPage(name, options = {}) {
  let definition;
  new Script(await readFile(resolve(root, `pages/${name}/index.js`), 'utf8')).runInNewContext({ require: () => helpers, wx, Page: (config) => { definition = config; }, encodeURIComponent });
  definition.data = structuredClone(definition.data);
  definition.setData = (data) => Object.assign(definition.data, data);
  definition.onLoad?.(options);
  return definition;
}
const detail = await loadPage('product', { id: 'textured-vest', variant: '2' });
assert.equal(detail.data.color, '杏橘');
assert.equal(detail.data.product.priceText, '价格待确认');
const share = detail.onShareAppMessage();
assert.equal(share.path, '/pages/product/index?id=textured-vest&variant=2');
assert(share.imageUrl.endsWith('vest-apricot.jpg'));
const recipient = await loadPage('product', { id: 'textured-vest', variant: '2' });
assert.equal(recipient.data.images[0], share.imageUrl);
detail.changeVariant({ currentTarget: { dataset: { index: '1' } } });
assert.equal(detail.data.color, '燕麦棕');
assert(detail.onShareTimeline().query.endsWith('variant=1'));
const invalidVariant = await loadPage('product', { id: 'textured-vest', variant: '999' });
assert.equal(invalidVariant.data.variantIndex, 0);
const missing = await loadPage('product', { id: 'unavailable' });
assert.equal(missing.data.missing, true);
assert.equal(missing.onShareAppMessage().path, '/pages/home/index');
const collection = await loadPage('collection');
collection.filterProducts({ currentTarget: { dataset: { filter: 'knitwear' } } });
assert.equal(collection.data.count, 5);
collection.filterProducts({ currentTarget: { dataset: { filter: 'skirts' } } });
assert.equal(collection.data.products[0].id, 'olive-skirt');
helpers.openProduct({ currentTarget: { dataset: { id: 'olive-skirt' } } });
assert(calls.some(call => call.name === 'navigateTo' && call.url === '/pages/product/index?id=olive-skirt'));
const boutique = await loadPage('boutique');
boutique.openPhoto({ currentTarget: { dataset: { index: '3' } } });
assert(calls.some(call => call.name === 'previewImage' && call.urls.length === 4 && call.current.endsWith('boutique-moment.jpg')));
console.log(`Mini program checks passed: ${app.pages.length} pages, ${photos.size} local photos, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB package.`);
console.log('Verified: category filters, valid/invalid product links, color-preserving share routes, store album. These checks mock wx APIs; real WeChat device testing still requires an AppID.');
