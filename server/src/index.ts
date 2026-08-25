import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getLocalIpAddress } from './utils/network.js';
import { deviceManager } from './services/deviceManager.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { ClientToServerEvents, ServerToClientEvents } from './types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const startTime = Date.now();

// Serve production static frontend if built
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get(['/health', '/healthz'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    devicesCount: deviceManager.getCount(),
    timestamp: new Date().toISOString(),
  });
});

// Root landing page / fallback
app.get('/', (_req: Request, res: Response) => {
  // If production client build exists, serve index.html
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  const localIp = getLocalIpAddress();
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NearFlux Signaling Server</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
        .card { background: #1e293b; border-radius: 12px; padding: 2rem; max-width: 480px; width: 100%; border: 1px solid #334155; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); text-align: center; }
        h1 { margin-top: 0; color: #3b82f6; font-size: 1.5rem; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.25rem; }
        .btn { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; transition: background 0.2s; }
        .btn:hover { background: #2563eb; }
        .footer { margin-top: 1.5rem; pt: 1rem; border-top: 1px solid #334155; font-size: 0.8rem; color: #64748b; }
        a.link { color: #60a5fa; text-decoration: none; }
        a.link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚀 NearFlux Signaling Server</h1>
        <p>The backend signaling server is online and ready.</p>
        <p>To access the main application user interface, open port <strong>5173</strong>:</p>
        <a class="btn" href="http://${localIp}:5173">Open NearFlux App (Port 5173)</a>
        <div class="footer">
          Server Status: <a class="link" href="/health">/health</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log('----------------------------------------------------');
  console.log(`🚀 NearFlux Signaling Server is running!`);
  console.log(`📡 Local Access:   http://localhost:${PORT}`);
  console.log(`🌐 Network Access: http://${localIp}:${PORT}`);
  console.log(`💻 React App UI:   http://${localIp}:5173`);
  console.log(`🏥 Health Check:   http://${localIp}:${PORT}/health`);
  console.log('----------------------------------------------------');
});
