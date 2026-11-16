import express, { type Request, type Response } from 'express';
import { spawn, type ChildProcess } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREVIEW_PORT = Number(process.env.PORT || 3000);
const C_BACKEND_PORT = Number(process.env.AQUABILL_PORT || 8081);
const C_BINARY = path.resolve(__dirname, 'backend', 'aquabill_server');
const DB_PATH = path.resolve(__dirname, 'database', 'aquabill.db');
const WEB_ROOT = path.resolve(__dirname, 'frontend');

let cProcess: ChildProcess | null = null;

function startCBackend(): void {
  if (cProcess) return;
  cProcess = spawn(
    C_BINARY,
    ['--port', String(C_BACKEND_PORT), '--db', DB_PATH, '--web-root', WEB_ROOT],
    {
      cwd: __dirname,
      stdio: 'inherit'
    }
  );
  cProcess.on('exit', (code, signal) => {
    console.error(`[Proxy] C backend exited (code=${code}, signal=${signal})`);
    cProcess = null;
  });
}

function stopCBackend(): void {
  if (cProcess) {
    cProcess.kill('SIGTERM');
    cProcess = null;
  }
}

process.on('SIGINT', () => {
  stopCBackend();
  process.exit(0);
});
process.on('SIGTERM', () => {
  stopCBackend();
  process.exit(0);
});

startCBackend();

const app = express();

app.use('/api', (req: Request, res: Response) => {
  const targetPath = req.originalUrl;
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: C_BACKEND_PORT,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${C_BACKEND_PORT}`
      }
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 502);
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (v !== undefined) {
          res.setHeader(k, v);
        }
      }
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(503).json({
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: `C backend unreachable on port ${C_BACKEND_PORT}: ${err.message}`
        }
      });
    }
  });

  req.pipe(proxyReq);
});

app.use(express.static(WEB_ROOT));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(WEB_ROOT, 'index.html'));
});

app.listen(PREVIEW_PORT, '0.0.0.0', () => {
  console.log(`[AquaBill Preview Gateway] Listening on http://0.0.0.0:${PREVIEW_PORT} -> C Mongoose backend :${C_BACKEND_PORT}`);
});
