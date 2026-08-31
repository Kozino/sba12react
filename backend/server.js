'use strict';
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { readLocalFile, isSupabase } = require('./src/storage');
const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');

const app = express();
app.disable('x-powered-by');

const FRONTEND_URL = (process.env.FRONTEND_URL || '').trim();
app.use(
  cors({
    origin: FRONTEND_URL
      ? [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
      : true,
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

app.get('/api/health', (req, res) => {
  res.json({ ok: true, storage: isSupabase() ? 'supabase' : 'local' });
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// JSON 404 + error handler
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `SBA 2012 API listening on :${PORT} — storage: ${
      isSupabase() ? 'Supabase' : 'local disk (dev)'
    }`
  );
});
