import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.wxss': 'text/css', '.wxml': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const port = Number(process.env.MINI_PREVIEW_PORT || 4174);
createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let relative = pathname.replace(/^\/+/, '');
    if (relative === '' || relative === 'mini-preview/' || relative === 'mini-preview') relative = 'mini-preview/index.html';
    const path = resolve(root, relative);
    const allowed = relative.startsWith('mini-preview/') || relative.startsWith('miniprogram/pages/') || relative.startsWith('miniprogram/utils/') || relative.startsWith('miniprogram/data/') || relative.startsWith('miniprogram/assets/') || ['miniprogram/app.json', 'miniprogram/app.wxss', 'assets/favicon.svg'].includes(relative);
    if (!path.startsWith(root + sep) || !allowed || !types[extname(path)]) throw new Error('Not allowed');
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Mini program interface preview: http://127.0.0.1:${port}/mini-preview/`));
