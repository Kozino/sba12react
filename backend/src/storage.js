'use strict';
const path = require('path');

/**
 * File storage.
 *  - Supabase mode (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set):
 *    files go to the public Storage bucket `uploads`.
 *  - Local mode (development): files go to ./uploads and are served
 *    by Express at /file/<name>.
 *
 * The database always stores the object NAME (e.g. "news-20260831-abc.jpg").
 * The frontend asks the API for the file: GET /file/<name>.
 */
const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const LOCAL_DIR = path.join(__dirname, '..', 'uploads');

const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const fs = require('fs');

function isSupabase() {
  return Boolean(supabase);
}

async function storeFile(buffer, name, contentType) {
  if (supabase) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, buffer, { contentType, upsert: true });
    if (error) throw new Error('Storage upload failed: ' + error.message);
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, name), buffer);
  }
}

async function deleteFile(name) {
  if (!name) return;
  if (supabase) {
    await supabase.storage.from(BUCKET).remove([name]).catch(() => {});
  } else {
    const p = path.join(LOCAL_DIR, path.basename(name));
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

/** Read a local file (dev mode only). Returns Buffer or null. */
function readLocalFile(name) {
  const p = path.join(LOCAL_DIR, path.basename(name));
  return fs.existsSync(p) ? fs.readFileSync(p) : null;
}

function localDir() {
  return LOCAL_DIR;
}

module.exports = { storeFile, deleteFile, readLocalFile, localDir, isSupabase, BUCKET };
