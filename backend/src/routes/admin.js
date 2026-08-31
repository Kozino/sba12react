'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { q, one } = require('../db');
const { storeFile, deleteFile } = require('../storage');
const { signToken, requireAdmin } = require('../auth');
const { PAYMENT_TYPES, DOC_TYPES, validEmail, yearInt } = require('../util');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const EXT_OK = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt', '.doc', '.docx']);

/** Build a safe storage object name for an uploaded file. */
function objectName(original, prefix) {
  const ext = (path.extname(original || '').toLowerCase() || '.bin').slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}${EXT_OK.has(ext) ? ext : '.bin'}`;
}

const fullName = (m) =>
  [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ').trim();

/** Wrap async handlers; validation errors (with .status) bubble up as 4xx. */
const aw = (fn) => (req, res) => fn(req, res).catch((e) => {
  if (res.headersSent) return;
  const status = Number.isInteger(e.status) ? e.status : 500;
  if (status >= 500) console.error(e);
  res.status(status).json({ error: status < 500 ? e.message : 'Something went wrong on the server. Please try again.' });
});

/* ---------------- Login / logout ---------------- */

router.post(
  '/login',
  aw(async (req, res) => {
    const d = req.body || {};
    const username = String(d.username ?? '').trim();
    const password = String(d.password ?? '');
    if (!username || !password)
      return res.status(400).json({ error: 'Please enter your username and password.' });
    const admin = await one('SELECT * FROM admins WHERE username = $1', [username]);
    if (!admin || !bcrypt.compareSync(password, admin.password))
      return res.status(401).json({ error: 'Invalid username or password.' });
    res.json({ ok: true, name: admin.name || admin.username, token: signToken(admin) });
  })
);

router.post('/logout', (req, res) => res.json({ ok: true }));

// Everything below requires a valid admin token
router.use(requireAdmin);

/* ---------------- Members ---------------- */

router.get(
  '/members',
  aw(async (req, res) => {
    const rows = await q(
      `SELECT m.*,
        (SELECT COALESCE(SUM(p.paid), 0) FROM payments p WHERE p.member_id = m.id) AS total_paid,
        (SELECT COALESCE(SUM(CASE WHEN p.expected > p.paid THEN p.expected - p.paid ELSE 0 END), 0)
             FROM payments p WHERE p.member_id = m.id) AS total_owing
         FROM members m
        ORDER BY m.registered_at DESC, m.id DESC`
    );
    res.json({ members: rows });
  })
);

router.get(
  '/members/:id',
  aw(async (req, res) => {
    const member = await one('SELECT * FROM members WHERE id = $1', [Number(req.params.id)]);
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    const payments = await q(
      'SELECT * FROM payments WHERE member_id = $1 ORDER BY year DESC, type ASC',
      [member.id]
    );
    res.json({ member, payments });
  })
);

const MEMBER_FIELDS = [
  'first_name', 'middle_name', 'last_name', 'email', 'phone',
  'hometown', 'hometown_parish', 'residential_address', 'permanent_address',
];

router.put(
  '/members/:id',
  aw(async (req, res) => {
    const d = req.body || {};
    const clean = (v) => String(v ?? '').trim();
    const values = {};
    for (const f of MEMBER_FIELDS) values[f] = clean(d[f]);
    if (!values.first_name || !values.last_name)
      return res.status(400).json({ error: 'First name and last name are required.' });
    const member = await one(
      `UPDATE members SET
         first_name=$1, middle_name=$2, last_name=$3, email=$4, phone=$5,
         hometown=$6, hometown_parish=$7, residential_address=$8, permanent_address=$9,
         updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [...MEMBER_FIELDS.map((f) => values[f]), Number(req.params.id)]
    );
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    res.json({ member: { ...member, full_name: fullName(member) } });
  })
);

router.put(
  '/members/:id/status',
  aw(async (req, res) => {
    const status = String((req.body || {}).status ?? '');
    if (!['active', 'pending', 'rejected'].includes(status))
      return res.status(400).json({ error: 'Invalid status.' });
    const member = await one(
      'UPDATE members SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, Number(req.params.id)]
    );
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    res.json({ member });
  })
);

router.delete(
  '/members/:id',
  aw(async (req, res) => {
    const member = await one('SELECT * FROM members WHERE id = $1', [Number(req.params.id)]);
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    await q('DELETE FROM members WHERE id = $1', [member.id]); // payments cascade
    res.json({ ok: true });
  })
);

/* ---------------- Payments ---------------- */

router.get(
  '/payments',
  aw(async (req, res) => {
    const filterMember = String(req.query.member || '').trim();
    let payments;
    if (filterMember) {
      const m = await one('SELECT * FROM members WHERE unique_id = $1', [filterMember]);
      if (!m) return res.json({ payments: [] });
      payments = await q(
        `SELECT p.*, m.first_name, m.last_name, m.unique_id
           FROM payments p JOIN members m ON m.id = p.member_id
          WHERE p.member_id = $1
          ORDER BY p.year DESC, p.type ASC`,
        [m.id]
      );
    } else {
      payments = await q(
        `SELECT p.*, m.first_name, m.last_name, m.unique_id
           FROM payments p JOIN members m ON m.id = p.member_id
          ORDER BY m.last_name ASC, m.first_name ASC, p.year DESC, p.type ASC`
      );
    }
    res.json({ payments });
  })
);

router.post(
  '/payments',
  aw(async (req, res) => {
    const d = req.body || {};
    const member_id = Number(d.member_id);
    const type = String(d.type ?? '');
    const year = Number(d.year);
    const expected = Number(d.expected) || 0;
    const paid = Number(d.paid) || 0;
    const note = String(d.note ?? '').trim();

    if (!member_id || !Number.isInteger(member_id))
      return res.status(400).json({ error: 'Please select a member.' });
    if (!PAYMENT_TYPES.includes(type))
      return res.status(400).json({ error: 'Invalid payment type.' });
    if (!Number.isInteger(year) || year < 2000 || year > 2100)
      return res.status(400).json({ error: 'Please enter a valid year.' });
    if (expected < 0 || paid < 0)
      return res.status(400).json({ error: 'Amounts cannot be negative.' });

    // Removing a record: both amounts zero
    if (expected === 0 && paid === 0) {
      await q(
        'DELETE FROM payments WHERE member_id=$1 AND type=$2 AND year=$3',
        [member_id, type, year]
      );
      return res.json({ payment: null, removed: true });
    }

    const payment = await one(
      `INSERT INTO payments (member_id, type, year, expected, paid, note)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (member_id, type, year)
       DO UPDATE SET expected=$4, paid=$5, note=$6, updated_at=NOW()
       RETURNING *`,
      [member_id, type, year, expected, paid, note]
    );
    res.json({ payment });
  })
);

router.delete(
  '/payments/:id',
  aw(async (req, res) => {
    const p = await one('SELECT * FROM payments WHERE id = $1', [Number(req.params.id)]);
    if (!p) return res.status(404).json({ error: 'Payment record not found.' });
    await q('DELETE FROM payments WHERE id = $1', [p.id]);
    res.json({ ok: true });
  })
);

/* ---------------- News / Blogs / Gallery (multipart) ---------------- */

function multipart(req) {
  // req.body holds text fields (multer text parts), req.files the files
  const fields = req.body || {};
  const file = (req.files || []).find((f) => f.size > 0) || null;
  return { fields, file };
}

async function handleItemCreate(req, table, prefix, fieldsMap, res) {
  const { fields, file } = multipart(req);
  let image = '';
  if (file) {
    const name = objectName(file.originalname, prefix);
    await storeFile(file.buffer, name, file.mimetype || 'application/octet-stream');
    image = name;
  }
  const values = { ...fieldsMap(fields), image };
  const row = await one(
    `INSERT INTO ${table} (${Object.keys(values).join(', ')})
       VALUES (${Object.keys(values).map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING *`,
    Object.values(values)
  );
  res.status(201).json({ item: row });
}

// ---- news ----
router.get(
  '/news',
  aw(async (req, res) => {
    const rows = await q('SELECT * FROM news ORDER BY date DESC, id DESC');
    res.json({ news: rows });
  })
);
router.post(
  '/news',
  upload.any(),
  aw((req, res) =>
    handleItemCreate(req, 'news', 'news', (f) => {
      if (!String(f.title ?? '').trim())
        throw Object.assign(new Error('Title is required.'), { status: 400 });
      return {
        title: String(f.title).trim(),
        body: String(f.body ?? ''),
        date: String(f.date ?? '') || new Date().toISOString().slice(0, 10),
        image: '',
      };
    }, res)
  )
);
router.put(
  '/news/:id',
  upload.any(),
  aw(async (req, res) => {
    const { fields, file } = multipart(req);
    if (!String(fields.title ?? '').trim())
      return res.status(400).json({ error: 'Title is required.' });
    const existing = await one('SELECT * FROM news WHERE id = $1', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'News item not found.' });
    let image = existing.image;
    if (file) {
      const name = objectName(file.originalname, 'news');
      await storeFile(file.buffer, name, file.mimetype || 'application/octet-stream');
      image = name;
      await deleteFile(existing.image);
    }
    const item = await one(
      `UPDATE news SET title=$1, body=$2, date=$3, image=$4, updated_at=NOW()
        WHERE id=$5 RETURNING *`,
      [
        String(fields.title).trim(),
        String(fields.body ?? ''),
        String(fields.date ?? '') || existing.date,
        image,
        Number(req.params.id),
      ]
    );
    res.json({ item });
  })
);
router.delete(
  '/news/:id',
  aw(async (req, res) => {
    const item = await one('SELECT * FROM news WHERE id = $1', [Number(req.params.id)]);
    if (!item) return res.status(404).json({ error: 'News item not found.' });
    await q('DELETE FROM news WHERE id = $1', [item.id]);
    await deleteFile(item.image);
    res.json({ ok: true });
  })
);

// ---- blogs ----
router.get(
  '/blogs',
  aw(async (req, res) => {
    const rows = await q('SELECT * FROM blogs ORDER BY date DESC, id DESC');
    res.json({ blogs: rows });
  })
);
router.post(
  '/blogs',
  upload.any(),
  aw((req, res) =>
    handleItemCreate(req, 'blogs', 'blog', (f) => {
      if (!String(f.title ?? '').trim())
        throw Object.assign(new Error('Title is required.'), { status: 400 });
      return {
        title: String(f.title).trim(),
        author: String(f.author ?? '').trim(),
        excerpt: String(f.excerpt ?? '').trim(),
        body: String(f.body ?? ''),
        date: String(f.date ?? '') || new Date().toISOString().slice(0, 10),
        image: '',
      };
    }, res)
  )
);
router.put(
  '/blogs/:id',
  upload.any(),
  aw(async (req, res) => {
    const { fields, file } = multipart(req);
    if (!String(fields.title ?? '').trim())
      return res.status(400).json({ error: 'Title is required.' });
    const existing = await one('SELECT * FROM blogs WHERE id = $1', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'Blog post not found.' });
    let image = existing.image;
    if (file) {
      const name = objectName(file.originalname, 'blog');
      await storeFile(file.buffer, name, file.mimetype || 'application/octet-stream');
      image = name;
      await deleteFile(existing.image);
    }
    const item = await one(
      `UPDATE blogs SET title=$1, author=$2, excerpt=$3, body=$4, date=$5, image=$6,
        updated_at=NOW() WHERE id=$7 RETURNING *`,
      [
        String(fields.title).trim(),
        String(fields.author ?? '').trim(),
        String(fields.excerpt ?? '').trim(),
        String(fields.body ?? ''),
        String(fields.date ?? '') || existing.date,
        image,
        Number(req.params.id),
      ]
    );
    res.json({ item });
  })
);
router.delete(
  '/blogs/:id',
  aw(async (req, res) => {
    const item = await one('SELECT * FROM blogs WHERE id = $1', [Number(req.params.id)]);
    if (!item) return res.status(404).json({ error: 'Blog post not found.' });
    await q('DELETE FROM blogs WHERE id = $1', [item.id]);
    await deleteFile(item.image);
    res.json({ ok: true });
  })
);

// ---- gallery ----
router.get(
  '/gallery',
  aw(async (req, res) => {
    const rows = await q('SELECT * FROM gallery ORDER BY event_year DESC, id DESC');
    res.json({ gallery: rows });
  })
);
router.post(
  '/gallery',
  upload.any(),
  aw(async (req, res) => {
    const { fields, file } = multipart(req);
    if (!file) return res.status(400).json({ error: 'Please choose an image to upload.' });
    const name = objectName(file.originalname, 'gallery');
    await storeFile(file.buffer, name, file.mimetype || 'image/jpeg');
    const item = await one(
      'INSERT INTO gallery (title, caption, image, event_year) VALUES ($1,$2,$3,$4) RETURNING *',
      [String(fields.title ?? '').trim(), String(fields.caption ?? '').trim(), name, yearInt(fields.event_year)]
    );
    res.status(201).json({ item });
  })
);
router.put(
  '/gallery/:id',
  upload.any(),
  aw(async (req, res) => {
    const { fields, file } = multipart(req);
    const existing = await one('SELECT * FROM gallery WHERE id = $1', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: 'Gallery item not found.' });
    let image = existing.image;
    if (file) {
      const name = objectName(file.originalname, 'gallery');
      await storeFile(file.buffer, name, file.mimetype || 'image/jpeg');
      image = name;
      await deleteFile(existing.image);
    }
    const item = await one(
      'UPDATE gallery SET title=$1, caption=$2, image=$3, event_year=$4 WHERE id=$5 RETURNING *',
      [
        String(fields.title ?? '').trim(),
        String(fields.caption ?? '').trim(),
        image,
        yearInt(fields.event_year, existing.event_year),
        Number(req.params.id),
      ]
    );
    res.json({ item });
  })
);
router.delete(
  '/gallery/:id',
  aw(async (req, res) => {
    const item = await one('SELECT * FROM gallery WHERE id = $1', [Number(req.params.id)]);
    if (!item) return res.status(404).json({ error: 'Gallery item not found.' });
    await q('DELETE FROM gallery WHERE id = $1', [item.id]);
    await deleteFile(item.image);
    res.json({ ok: true });
  })
);

/* ---------------- Documents (multipart) ---------------- */

router.get(
  '/documents',
  aw(async (req, res) => {
    const rows = await q('SELECT * FROM documents ORDER BY type ASC, year DESC NULLS LAST, id DESC');
    res.json({ documents: rows });
  })
);
router.post(
  '/documents',
  upload.any(),
  aw(async (req, res) => {
    const { fields, file } = multipart(req);
    const type = String(fields.type ?? '');
    if (!DOC_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid document type.' });
    if (!String(fields.title ?? '').trim()) return res.status(400).json({ error: 'Title is required.' });
    if (!String(fields.text ?? '').trim() && !file)
      return res.status(400).json({ error: 'Please provide a file or paste the text of the document.' });

    const yearRaw = String(fields.year ?? '').trim();
    let year = null;
    if (yearRaw) {
      const n = parseInt(yearRaw, 10);
      if (!Number.isInteger(n) || n < 1990 || n > 2100)
        return res.status(400).json({ error: 'Please enter a valid year.' });
      year = n;
    }

    let filename = '';
    if (file) {
      filename = objectName(file.originalname, 'doc');
      await storeFile(file.buffer, filename, file.mimetype || 'application/octet-stream');
    }
    const item = await one(
      `INSERT INTO documents (type, year, title, filename, text) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [type, year, String(fields.title).trim(), filename, String(fields.text ?? '').trim()]
    );
    res.status(201).json({ item });
  })
);
router.delete(
  '/documents/:id',
  aw(async (req, res) => {
    const item = await one('SELECT * FROM documents WHERE id = $1', [Number(req.params.id)]);
    if (!item) return res.status(404).json({ error: 'Document not found.' });
    await q('DELETE FROM documents WHERE id = $1', [item.id]);
    await deleteFile(item.filename);
    res.json({ ok: true });
  })
);

/* ---------------- Messages ---------------- */

router.get(
  '/messages',
  aw(async (req, res) => {
    const rows = await q('SELECT * FROM messages ORDER BY created_at DESC, id DESC');
    res.json({ messages: rows });
  })
);
router.delete(
  '/messages/:id',
  aw(async (req, res) => {
    const m = await one('SELECT * FROM messages WHERE id = $1', [Number(req.params.id)]);
    if (!m) return res.status(404).json({ error: 'Message not found.' });
    await q('DELETE FROM messages WHERE id = $1', [m.id]);
    res.json({ ok: true });
  })
);

/* ---------------- Settings ---------------- */

const DEFAULT_SETTINGS = {
  contact_email: 'info@savioboscoalphas.org',
  contact_phone: '+234 803 000 0000',
  contact_address: 'St. Dominic Savio Seminary, Akpu, Orumba South LGA, Anambra State, Nigeria',
};

router.get(
  '/settings',
  aw(async (req, res) => {
    const rows = await q('SELECT key, value FROM settings');
    const out = { ...DEFAULT_SETTINGS };
    for (const r of rows) out[r.key] = r.value;
    res.json({ settings: out });
  })
);
router.put(
  '/settings',
  aw(async (req, res) => {
    const d = req.body || {};
    for (const key of ['contact_email', 'contact_phone', 'contact_address']) {
      if (d[key] !== undefined) {
        await q(
          `INSERT INTO settings (key, value) VALUES ($1,$2)
           ON CONFLICT (key) DO UPDATE SET value=$2`,
          [key, String(d[key]).trim()]
        );
      }
    }
    const rows = await q('SELECT key, value FROM settings');
    const out = { ...DEFAULT_SETTINGS };
    for (const r of rows) out[r.key] = r.value;
    res.json({ settings: out });
  })
);

/* ---------------- Password ---------------- */

router.post(
  '/password',
  aw(async (req, res) => {
    const d = req.body || {};
    const current = String(d.current ?? '');
    const next = String(d.next ?? '');
    if (!current) return res.status(400).json({ error: 'Please enter your current password.' });
    if (next.length < 8)
      return res.status(400).json({ error: 'The new password must be at least 8 characters long.' });
    const admin = await one('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    if (!admin || !bcrypt.compareSync(current, admin.password))
      return res.status(400).json({ error: 'The current password is incorrect.' });
    await q('UPDATE admins SET password=$1 WHERE id=$2', [bcrypt.hashSync(next, 10), admin.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
