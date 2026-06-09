#!/usr/bin/env node
/**
 * proxy.js — Beeper Desktop API relay
 *
 * Beeper Desktop only binds to 127.0.0.1:23373 (localhost).
 * This script re-exposes it on all network interfaces so your
 * phone (on the same WiFi) can reach it.
 *
 * Usage:
 *   node proxy.js
 *   # Then enter http://<your-computer-ip>:23374 in the app's Connect screen.
 *
 * How to find your computer's IP:
 *   macOS/Linux:  ifconfig | grep "inet " | grep -v 127
 *   Windows:      ipconfig | findstr "IPv4"
 */

const http = require('http');

const BEEPER_HOST = '127.0.0.1';
const BEEPER_PORT = 23373;
const PROXY_PORT  = 23374;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const server = http.createServer((req, res) => {
  // Pre-flight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const options = {
    hostname: BEEPER_HOST,
    port:     BEEPER_PORT,
    path:     req.url,
    method:   req.method,
    headers:  { ...req.headers, host: `${BEEPER_HOST}:${BEEPER_PORT}` },
  };

  const proxy = http.request(options, (beeperRes) => {
    res.writeHead(beeperRes.statusCode, { ...beeperRes.headers, ...CORS });
    beeperRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('Beeper unreachable:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json', ...CORS });
    res.end(JSON.stringify({ error: 'Beeper Desktop not reachable', detail: err.message }));
  });

  req.pipe(proxy, { end: true });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  const ips = [];
  for (const iface of Object.values(nets)) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) ips.push(alias.address);
    }
  }
  console.log('\n✓ Beeper proxy running');
  console.log(`  Forwarding 0.0.0.0:${PROXY_PORT} → ${BEEPER_HOST}:${BEEPER_PORT}\n`);
  ips.forEach(ip => console.log(`  Enter in app:  http://${ip}:${PROXY_PORT}`));
  console.log('\n  Keep this terminal open while using the app.\n');
});
