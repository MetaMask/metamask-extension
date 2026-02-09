#!/usr/bin/env node
/**
 * Designer Mode Server
 *
 * A lightweight HTTP relay between the Designer Mode panel (in the browser)
 * and AI agent CLIs (Claude Code, Cursor, Codex, Aider, etc.).
 *
 * The browser panel POSTs design requests to this server.
 * The agent CLI long-polls via GET /api/wait to receive them.
 *
 * Usage:
 *   yarn designer-server          # start the relay server
 *   yarn designer-wait            # (in another terminal) block until a request arrives
 *
 * Environment:
 *   DESIGNER_PORT  — port to listen on (default: 3334)
 */

'use strict';

const http = require('http');

const PORT = parseInt(process.env.DESIGNER_PORT || '3334', 10);

// ── State ────────────────────────────────────────────────────────

/** @type {string[]} Messages from designer → agent */
const messageQueue = [];

/** @type {Array<{ resolve: (data: string) => void }>} */
const waitingClients = [];

/** @type {string[]} Responses from agent → designer panel */
const responseQueue = [];

// ── Handlers ─────────────────────────────────────────────────────

/**
 * POST /api/message — receive a design request from the browser panel.
 * If an agent CLI is long-polling, deliver immediately. Otherwise queue.
 */
function handleMessage(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    if (waitingClients.length > 0) {
      const client = waitingClients.shift();
      client.resolve(body);
      console.log(`  → Delivered to waiting agent`);
    } else {
      messageQueue.push(body);
      console.log(`  → Queued (${messageQueue.length} pending)`);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, queued: messageQueue.length }));
  });
}

/**
 * GET /api/wait — long-poll endpoint for the agent CLI.
 * Blocks until a message is available, then returns it as plain text.
 * Times out after 5 minutes with 204 No Content.
 */
function handleWait(_req, res) {
  // If there's already a queued message, return it immediately
  if (messageQueue.length > 0) {
    const message = messageQueue.shift();
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
    console.log(`  ← Delivered queued message to agent`);
    return;
  }

  // Otherwise long-poll: wait up to 5 minutes
  const timeoutMs = 300000;

  let resolved = false;
  const resolve = (data) => {
    if (resolved) {
      return;
    }
    resolved = true;
    clearTimeout(timeout);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(data);
    console.log(`  ← Delivered message to agent`);
  };

  const timeout = setTimeout(() => {
    if (resolved) {
      return;
    }
    resolved = true;
    const idx = waitingClients.findIndex((c) => c.resolve === resolve);
    if (idx !== -1) {
      waitingClients.splice(idx, 1);
    }
    res.writeHead(204);
    res.end();
  }, timeoutMs);

  waitingClients.push({ resolve });
  console.log(`  ⏳ Agent waiting for next request...`);
}

/**
 * POST /api/response — agent sends a response back to the designer panel.
 */
function handleResponse(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    responseQueue.push(body);
    console.log(`  ← Agent response queued for panel`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  });
}

/**
 * GET /api/responses — panel fetches all pending agent responses (and clears them).
 */
function handleResponses(_req, res) {
  const responses = responseQueue.splice(0, responseQueue.length);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ responses }));
}

/**
 * GET /api/health — health check.
 */
function handleHealth(_req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'ok',
      pending: messageQueue.length,
      waiting: waitingClients.length,
    }),
  );
}

// ── Server ───────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // CORS — allow the browser extension to call us
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  if (req.method === 'POST' && req.url === '/api/message') {
    handleMessage(req, res);
  } else if (req.method === 'GET' && req.url === '/api/wait') {
    handleWait(req, res);
  } else if (req.method === 'POST' && req.url === '/api/response') {
    handleResponse(req, res);
  } else if (req.method === 'GET' && req.url === '/api/responses') {
    handleResponses(req, res);
  } else if (req.method === 'GET' && req.url === '/api/health') {
    handleHealth(req, res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(``);
  console.log(`  🎨 Designer Mode Server`);
  console.log(`  ───────────────────────────────────────`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  Health:     http://localhost:${PORT}/api/health`);
  console.log(``);
  console.log(`  The designer panel will POST requests here.`);
  console.log(`  Run "yarn designer-wait" in your agent to receive them.`);
  console.log(``);
});
