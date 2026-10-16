// /api/qr?code=CODE — kthen një kod QR (SVG) me lidhjen e bashkimit: <origin>/?k=CODE
import QRCode from 'qrcode';
import { CODE_RE } from './_store.js';

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  const code = (req.query?.code ?? url.searchParams.get('code') ?? '').toString();
  if (!CODE_RE.test(code)) {
    res.statusCode = 400;
    return res.end('bad_code');
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https');
  const link = `${proto}://${host}/?k=${code}`;
  const svg = await QRCode.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#14261f', light: '#ffffff' } });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(svg);
}
