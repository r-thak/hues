import http from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { RoomManager } from './RoomManager.js';

const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const clientDistPath = path.resolve(__dirname, '../../client/dist');
const clientBuilt = fs.existsSync(clientDistPath);

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.webp': 'image/webp',
};

function serveStatic(req, res) {
    if (!clientBuilt) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hues and Cues server running. Client not built yet.');
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);
    let filePath = path.join(clientDistPath, pathname === '/' ? 'index.html' : pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(clientDistPath)) {
        res.writeHead(403);
        res.end();
        return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        // SPA fallback: serve index.html for any unknown path
        filePath = path.join(clientDistPath, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch {
        res.writeHead(500);
        res.end('Internal Server Error');
    }
}

const roomManager = new RoomManager();

const server = http.createServer((req, res) => {
    serveStatic(req, res);
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

wss.on('connection', (ws) => {
    roomManager.handleConnection(ws);
});

server.listen(PORT, () => {
    console.log(`[Server] Hues and Cues server listening on port ${PORT}`);
});
