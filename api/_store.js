// Ndihmës për /api/sync.
// Upstash Redis përmes REST API me fetch të thjeshtë (pa SDK).
// Variablat e mjedisit krijohen kur lidhni "Upstash for Redis" nga Vercel Marketplace me prefiksin "KV".

import { createHash } from 'node:crypto';
import { SCHEMA, mergeDoc, sanitize } from '../public/merge.js';

export const CODE_RE = /^[A-Z2-9]{10}$/;
const TTL_SECONDS = 400 * 24 * 3600; // kodet e paprekura për >400 ditë fshihen vetë
const MAX_BODY = 512 * 1024;

export async function redis(cmd) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    const e = new Error('not_configured');
    e.status = 503;
    throw e;
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const e = new Error(j.error || `redis_${r.status}`);
    e.status = 502;
    throw e;
  }
  return j.result;
}

export function etagOf(d) {
  return createHash('sha1').update(JSON.stringify(d)).digest('base64url').slice(0, 16);
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Cache-Control', 'no-store');
  if (body === undefined) return res.end();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') return req.body.length > MAX_BODY ? null : JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return req.body.length > MAX_BODY ? null : JSON.parse(req.body.toString('utf8'));
    return req.body;
  }
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) return null;
    chunks.push(c);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

function parseStored(raw) {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw);
    return o && typeof o.etag === 'string' && o.d ? o : null;
  } catch {
    return null;
  }
}

// Krijon një handler për kanalin e dhënë ('sync' ose 'marks').
export function makeHandler(channel) {
  const schema = SCHEMA[channel];
  return async function handler(req, res) {
    try {
      const url = new URL(req.url, 'http://x');
      const code = (req.query?.code ?? url.searchParams.get('code') ?? '').toString();
      if (!CODE_RE.test(code)) return send(res, 400, { error: 'bad_code' });
      const key = `juz:${channel}:${code}`;

      if (req.method === 'GET') {
        const etag = (req.query?.etag ?? url.searchParams.get('etag') ?? '').toString();
        const stored = parseStored(await redis(['GET', key])); // 1 komandë
        const cur = stored || { etag: etagOf({}), d: {} };
        if (etag && etag === cur.etag) return send(res, 304);
        // të dhënat nga versione më të vjetra pastrohen para se të dërgohen
        return send(res, 200, { etag: cur.etag, d: sanitize(cur.d, schema) });
      }

      if (req.method === 'POST') {
        let body;
        try {
          body = await readBody(req);
        } catch {
          return send(res, 400, { error: 'bad_json' });
        }
        if (body === null) return send(res, 413, { error: 'too_large' });
        const incoming = sanitize(body && body.d, schema);
        const stored = parseStored(await redis(['GET', key])); // komanda 1
        const merged = mergeDoc(stored ? sanitize(stored.d, schema) : {}, incoming, schema);
        const etag = etagOf(merged);
        const value = { etag, d: merged };
        await redis(['SET', key, JSON.stringify(value), 'EX', String(TTL_SECONDS)]); // komanda 2
        return send(res, 200, value);
      }

      res.setHeader('Allow', 'GET, POST');
      return send(res, 405, { error: 'method' });
    } catch (e) {
      return send(res, e.status || 500, { error: e.message || 'error' });
    }
  };
}
