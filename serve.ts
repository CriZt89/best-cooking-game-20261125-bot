// Rush Kitchen — local play-test server. Serves game/ at
// http://localhost:8080 so the game can be played and screenshotted in a
// desktop browser. Standard library only; not part of the graded game.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'game'));
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer(async (req, res) => {
  const path = normalize(join(root, decodeURIComponent(req.url ?? '/').split('?')[0]));
  if (!path.startsWith(root + sep) && path !== root) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  const file = (path === root || path === root + sep) ? join(root, 'index.html') : path;
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

server.listen(8080, () => {
  console.log('Rush Kitchen at http://localhost:8080');
});
