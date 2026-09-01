'use strict';
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { readLocalFile, isSupabase } = require('./src/storage');
const { pool } = require('./src/db');
const { dbErrorMessage } = require('./src/util');
const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');

const app = express();
app.disable('x-powered-by');

const FRONTEND_URLS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function originAllowed(origin) {
  if (!origin) return true; // same-origin or non-browser client
  if (FRONTEND_URLS.includes(origin)) return true; // exact (trailing-slash-insensitive)
  let host;
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (host === 'localhost' || host === '127.0.0.1') return true; // local dev
  // Any Netlify origin (main deploys + preview deploys)
  return (
    host.endsWith('.netlify.app') ||
    host.endsWith('.netlify.site') ||
    host === 'netlify.app' ||
    host === 'netlify.site'
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      let ok = false;
      try {
        ok = originAllowed(origin);
      } catch {
        ok = false; // malformed origin
      }
      callback(null, ok); // when ok, the requesting origin is reflected
    },
  })
);
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files. In Supabase mode the bucket is public, so we
// simply redirect the browser to the storage URL; in dev we stream locally.
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

app.get('/file/:name', (req, res) => {
  const name = path.basename(req.params.name);
  if (isSupabase()) {
    res.redirect(
      `${process.env.SUPABASE_URL}/storage/v1/object/public/${
        process.env.SUPABASE_BUCKET || 'uploads'
      }/${encodeURIComponent(name)}`
    );
    return;
  }
  const data = readLocalFile(name);
  if (!data) return res.status(404).json({ error: 'File not found.' });
  res.setHeader('Content-Type', MIME[path.extname(name).toLowerCase()] || 'application/octet-stream');
  if (req.query.dl === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  }
  res.send(data);
});

// Fast liveness probe — NO database access. Render polls this during
// deploys, so it must return instantly even if the DB is down.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, storage: isSupabase() ? 'supabase' : 'local' });
});

// Database diagnostic — open this in a browser to see exactly why data
// requests fail. Bounded so it can't hang.
app.get('/api/db', async (req, res) => {
  const timeoutMs = 8000;
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error('DB check timed out (unreachable host/port?)')), timeoutMs)
      ),
    ]);
    res.json({ ok: true, db: 'ok' });
  } catch (e) {
    res.json({ ok: false, db: 'ERROR: ' + (e.code || e.message) });
  }
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// JSON 404 + error handler (with actionable database diagnostics)
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: dbErrorMessage(err) });
});

const PORT = Number(process.env.PORT) || 8081;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `SBA 2012 API listening on :${PORT} — storage: ${
      isSupabase() ? 'Supabase' : 'local disk (dev)'
    }`
  );
});

// Render's own docs recommend raising these for Node.js services that see
// intermittent timeouts / "Connection reset by peer" behind their proxy.
// headersTimeout must be >= keepAliveTimeout.
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

// Surface a clear error if the port ever fails to bind, instead of the
// process silently hanging (helps distinguish "app crashed" from
// "Render's health check didn't reach it").
server.on('error', (err) => {
  console.error('Server failed to start:', err.code || '', err.message);
  process.exit(1);
});
