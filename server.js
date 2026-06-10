// server.js — Dabbs Fitness GROW Proxy
// Deploy to Render (free tier): https://render.com
// Set environment variables in Render dashboard:
//   GROW_API_KEY=your_api_key_here
//   ALLOWED_ORIGIN=https://claude.ai  (or your hosted dashboard URL)

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const GROW_API_KEY = process.env.GROW_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const BASE = 'https://services.leadconnectorhq.com';

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Generic proxy handler
async function proxyGrow(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${GROW_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  if (!res.ok) throw new Error(`GROW API error: ${res.status}`);
  return res.json();
}

// Health check
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// GET /contacts?locationId=xxx&limit=100
app.get('/contacts', async (req, res) => {
  try {
    const data = await proxyGrow('/contacts/', req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /opportunities?locationId=xxx&status=open&limit=100
app.get('/opportunities', async (req, res) => {
  try {
    const data = await proxyGrow('/opportunities/search', req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /contacts/:id — single contact with full details
app.get('/contacts/:id', async (req, res) => {
  try {
    const data = await proxyGrow(`/contacts/${req.params.id}`, req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
