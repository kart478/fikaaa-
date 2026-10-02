import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendPort = 5173;
const backendCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const backendArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm --prefix fika-backend run dev'] : ['--prefix', 'fika-backend', 'run', 'dev'];
const backend = spawn(backendCommand, backendArgs, { cwd: projectRoot, stdio: 'inherit' });

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const frontend = http.createServer((request, response) => {
  const requestedPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
  const filePath = resolve(projectRoot, normalize(relativePath));

  if (!filePath.startsWith(projectRoot) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream' });
  response.end(readFileSync(filePath));
});

frontend.listen(frontendPort, () => {
  console.log(`Fika frontend listening on http://localhost:${frontendPort}`);
});

function shutdown() {
  frontend.close();
  backend.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
backend.on('exit', code => {
  if (code && code !== 0) console.error(`Backend exited with code ${code}`);
});