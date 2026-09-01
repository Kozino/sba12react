'use strict';
const express = require('express');
const { q, one } = require('../db');
const {
  generateUniqueId,
  PAYMENT_TYPES,
  DOC_TYPES,
  validEmail,
  validPhone,
  dbErrorMessage,
} = require('../util');

const { CONSTITUTION_TEXT } = require('../constitution');
const router = express.Router();

const fullName = (m) =>
  [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ').trim();

/* ---------------- Home / public data ---------------- */

// Bundled data for the home page
router.get('/home', async (req, res) => {
  try {
    const [members, news, gallery] = await Promise.all([
      one('SELECT COUNT(*)::int AS c FROM members'),
      q('SELECT * FROM news ORDER BY date DESC, id DESC LIMIT 3'),
      q('SELECT * FROM gallery ORDER BY id DESC LIMIT 4'),
    ]);
    res.json({ members: members.c, news, gallery });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: dbErrorMessage(e) });
  }
});

router.get('/news', async (req, res) => {
  const rows = await q('SELECT * FROM news ORDER BY date DESC, id DESC');
  res.json({ news: rows });
});

router.get('/news/:id', async (req, res) => {
  const row = await one('SELECT * FROM news WHERE id = $1', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'News item not found.' });
  res.json({ news: row });
});

router.get('/blogs', async (req, res) => {
  const rows = await q('SELECT * FROM blogs ORDER BY date DESC, id DESC');
  res.json({ blogs: rows });
});

router.get('/blogs/:id', async (req, res) => {
  const row = await one('SELECT * FROM blogs WHERE id = $1', [Number(req.params.id)]);
  if (!row) return res.status(404).json({ error: 'Blog post not found.' });
  res.json({ blog: row });
});

router.get('/gallery', async (req, res) => {
  const rows = await q('SELECT * FROM gallery ORDER BY event_year DESC, id DESC');
  res.json({ gallery: rows });
});

router.get('/executives', async (req, res) => {
  const rows = await q(
    'SELECT id, name, position, image FROM executives ORDER BY sort_order ASC, id ASC'
  );
  res.json({ executives: rows });
});

/* ---------------- Chatbot (constitution + live site data Q&A) ---------------- */

const chatHits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const entry = chatHits.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  chatHits.set(ip, entry);
  return entry.count > 15;
}

// Cache DB-derived context so we're not hitting the database on every message.
// Bump SITE_CONTEXT_TTL_MS down (or clear siteContextCache.expiresAt = 0 from
// your admin update routes) if you want executive/news/gallery edits to show
// up in the chatbot immediately instead of waiting for the cache to expire.
const SITE_CONTEXT_TTL_MS = 10 * 60 * 1000; // 10 minutes
let siteContextCache = { text: null, expiresAt: 0 };

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return String(d);
  }
}

// news.body may contain HTML and can be long — strip tags and truncate to a
// short snippet so the prompt stays compact.
function snippet(html, maxLen = 200) {
  if (!html) return '';
  const text = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? text.slice(0, maxLen).trim() + '…' : text;
}

async function getSiteContext() {
  const now = Date.now();
  if (siteContextCache.text && now < siteContextCache.expiresAt) {
    return siteContextCache.text;
  }

  const [executives, settingsRows, memberCount, news, gallery] = await Promise.all([
    q('SELECT name, position FROM executives ORDER BY sort_order ASC, id ASC'),
    q('SELECT key, value FROM settings'),
    one('SELECT COUNT(*)::int AS c FROM members'),
    q('SELECT title, date, body FROM news ORDER BY date DESC, id DESC LIMIT 8'),
    q('SELECT title, event_year FROM gallery ORDER BY event_year DESC, id DESC LIMIT 15'),
  ]);

  const settings = {};
  for (const r of settingsRows) settings[r.key] = r.value;

  const execLines = executives.length
    ? executives.map((e) => `- ${e.position}: ${e.name}`).join('\n')
    : 'No executives are currently listed on the site.';

  const newsLines = news.length
    ? news
        .map((n) => {
          const s = snippet(n.body);
          return `- [${fmtDate(n.date)}] ${n.title}${s ? ` — ${s}` : ''}`;
        })
        .join('\n')
    : 'No news items are currently posted.';

  const galleryLines = gallery.length
    ? gallery.map((g) => `- ${g.title} (${g.event_year})`).join('\n')
    : 'No gallery events are currently listed.';

  const text = `
CURRENT EXECUTIVES:
${execLines}

CONTACT INFO:
Email: ${settings.contact_email || 'info@savioboscoalphas.org'}
Phone: ${settings.contact_phone || '+234 803 000 0000'}
Address: ${settings.contact_address || 'St. Dominic Savio Seminary, Akpu, Orumba South LGA, Anambra State, Nigeria'}

MEMBERSHIP: The association currently has ${memberCount.c} registered members.

RECENT NEWS (most recent first):
${newsLines}

GALLERY / PAST EVENTS:
${galleryLines}
`.trim();

  siteContextCache = { text, expiresAt: now + SITE_CONTEXT_TTL_MS };
  return text;
}

function buildSystemPrompt(siteContext) {
  return `You are the assistant for the Bosco Class of 2012 (SBA 2012) website. Answer questions using the constitution text and the current site information provided below. If the answer isn't in either, say so plainly and suggest the person contact the association's executives — do not guess or make anything up. Keep answers concise and friendly, in plain English. Do not mention that you were given documents or data; just answer naturally as the association's assistant.

CONSTITUTION:
${CONSTITUTION_TEXT}

${siteContext}`;
}

router.post('/chat', async (req, res) => {
  const question = String((req.body || {}).message || '').trim();
  if (!question) return res.status(400).json({ error: 'Please enter a question.' });
  if (question.length > 500)
    return res.status(400).json({ error: 'Please keep your question under 500 characters.' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Too many questions — please try again in a few minutes.' });
  }

  try {
    const siteContext = await getSiteContext();
    const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        max_tokens: 600,
        messages: [
          { role: 'system', content: buildSystemPrompt(siteContext) },
          { role: 'user', content: question },
        ],
      }),
    });
    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error('Groq API error:', data);
      return res.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
    }
    const answer = data.choices?.[0]?.message?.content?.trim();
    res.json({ answer: answer || "Sorry, I couldn't find an answer to that." });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
  }
});

// Public contact settings (no auth)
router.get('/settings', async (req, res) => {
  const DEFAULTS = {
    contact_email: 'info@savioboscoalphas.org',
    contact_phone: '+234 803 000 0000',
    contact_address: 'St. Dominic Savio Seminary, Akpu, Orumba South LGA, Anambra State, Nigeria',
  };
  const rows = await q('SELECT key, value FROM settings');
  const out = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  res.json({ settings: out });
});

/* ---------------- Registration ---------------- */

router.post('/register', async (req, res) => {
  const d = req.body || {};
  const clean = (v) => String(v ?? '').trim();
  const fields = {
    first_name: clean(d.firstName),
    middle_name: clean(d.middleName),
    last_name: clean(d.lastName),
    email: clean(d.email),
    phone: clean(d.phone),
    hometown: clean(d.hometown),
    hometown_parish: clean(d.hometownParish),
    residential_address: clean(d.residentialAddress),
    permanent_address: clean(d.permanentAddress),
  };

  if (!fields.first_name || !fields.last_name)
    return res.status(400).json({ error: 'First name and last name are required.' });
  if (!validEmail(fields.email))
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (fields.phone && !validPhone(fields.phone))
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (!fields.hometown)
    return res.status(400).json({ error: 'Please enter your hometown.' });

  try {
    const unique_id = await generateUniqueId();
    const member = await one(
      `INSERT INTO members
        (unique_id, first_name, middle_name, last_name, email, phone,
         hometown, hometown_parish, residential_address, permanent_address, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
       RETURNING *`,
      [
        unique_id,
        fields.first_name,
        fields.middle_name,
        fields.last_name,
        fields.email,
        fields.phone,
        fields.hometown,
        fields.hometown_parish,
        fields.residential_address,
        fields.permanent_address,
      ]
    );
    res.json({ ok: true, uniqueId: member.unique_id, fullName: fullName(member), status: member.status });
  } catch (e) {
    if (String(e.message || '').includes('email')) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    console.error(e);
    res.status(400).json({ error: 'Registration failed. Please try again.' });
  }
});

/* ---------------- Contact ---------------- */

router.post('/contact', async (req, res) => {
  const d = req.body || {};
  const clean = (v) => String(v ?? '').trim();
  const fields = {
    name: clean(d.name),
    email: clean(d.email),
    phone: clean(d.phone),
    subject: clean(d.subject),
    message: clean(d.message),
  };
  if (!fields.name || !fields.email || !fields.subject || !fields.message)
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  if (!validEmail(fields.email))
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  await q(
    `INSERT INTO messages (name, email, phone, subject, message) VALUES ($1,$2,$3,$4,$5)`,
    [fields.name, fields.email, fields.phone, fields.subject, fields.message]
  );
  res.json({ ok: true });
});

/* ---------------- Audit portal (ID-gated) ---------------- */

router.get('/audit', async (req, res) => {
  const id = String(req.query.id || '').trim().toUpperCase();
  if (!id) return res.status(400).json({ error: 'Please provide a member ID.' });
  if (!/^SBA12[A-HJ-NP-Z2-9]{3}$/.test(id)) {
    return res
      .status(400)
      .json({ error: 'This ID is not in a valid format. It should be 8 characters, starting with SBA12.' });
  }

  const member = await one('SELECT * FROM members WHERE unique_id = $1', [id]);
  if (!member) {
    return res
      .status(404)
      .json({ error: 'No member was found with that ID. Please check your member ID and try again.' });
  }
  if (member.status === 'pending') {
    return res.status(403).json({
      error:
        "Your registration is still awaiting approval by the association's executives. Your member ID will become active on the Audit Portal once your registration has been approved. Please try again later or contact the association.",
    });
  }
  if (member.status === 'rejected') {
    return res.status(404).json({
      error:
        "This registration has not been approved by the association. Please contact the association's secretariat for assistance.",
    });
  }

  const payments = await q(
    'SELECT * FROM payments WHERE member_id = $1 ORDER BY year DESC, type ASC',
    [member.id]
  );
  const totals = payments.reduce(
    (t, p) => {
      t.expected += Number(p.expected) || 0;
      t.paid += Number(p.paid) || 0;
      t.owing += Math.max(0, (Number(p.expected) || 0) - (Number(p.paid) || 0));
      return t;
    },
    { expected: 0, paid: 0, owing: 0 }
  );
  const documents = await q('SELECT * FROM documents ORDER BY type ASC, year DESC NULLS LAST, id DESC');

  res.json({
    ok: true,
    member: {
      unique_id: member.unique_id,
      first_name: member.first_name,
      middle_name: member.middle_name,
      last_name: member.last_name,
      hometown: member.hometown,
      hometown_parish: member.hometown_parish,
      registered_at: member.registered_at,
    },
    payments,
    totals,
    documents,
  });
});

module.exports = router;
module.exports.PAYMENT_TYPES = PAYMENT_TYPES;
module.exports.DOC_TYPES = DOC_TYPES;
