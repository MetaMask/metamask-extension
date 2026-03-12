#!/usr/bin/env node

/**
 * Enhanced Mock Segment API with event collection and REST query capabilities.
 *
 * This extends the basic mock-segment.js by storing all received events in
 * memory and exposing REST endpoints to query, filter, and clear them.
 *
 * Intended for validating that the extension fires the correct Segment
 * analytics events during manual or automated UI flows (e.g., via the
 * MetaMask MCP visual testing tools).
 *
 * ## Setup
 *
 * 1. Set these values in `.metamaskrc`:
 *      SEGMENT_HOST='http://localhost:9090'
 *      SEGMENT_WRITE_KEY='FAKE'
 *
 * 2. Build the extension:
 *      yarn build:test
 *
 * 3. Start this collector:
 *      node development/mock-segment-collector.js
 *
 * 4. Load the extension and opt into MetaMetrics (Settings > Security &
 *    Privacy > Participate in MetaMetrics).
 *
 * 5. Perform UI flows (send, swap, sign, etc.).
 *
 * 6. Query collected events:
 *      curl http://localhost:9090/events                              # all events
 *      curl http://localhost:9090/events?event=Transaction+Submitted  # filter by event name
 *      curl http://localhost:9090/events?type=track                   # filter by type
 *      curl http://localhost:9090/events?category=Transactions        # filter by properties.category
 *      curl -X DELETE http://localhost:9090/events                    # clear all events
 *
 * ## REST API
 *
 * ### GET /events
 *   Returns JSON array of all collected events.
 *   Optional query parameters (combinable):
 *     - event    : Filter by event name (e.g., "Transaction Submitted")
 *     - type     : Filter by Segment type ("track", "page", "identify")
 *     - category : Filter by properties.category
 *
 *   Response shape:
 *   [
 *     {
 *       "receivedAt": "2026-03-03T10:00:00.000Z",
 *       "type": "track",
 *       "event": "Transaction Submitted",
 *       "properties": { ... },
 *       "userId": "...",
 *       "anonymousId": "...",
 *       ...
 *     }
 *   ]
 *
 * ### GET /events/summary
 *   Returns a compact summary: event counts grouped by name.
 *   Response shape:
 *   {
 *     "total": 12,
 *     "byEvent": {
 *       "Transaction Submitted": 2,
 *       "Transaction Finalized": 2,
 *       ...
 *     }
 *   }
 *
 * ### DELETE /events
 *   Clears all stored events. Returns { "cleared": <count> }.
 *
 * ### POST /v1/batch
 *   Standard Segment batch endpoint. Events are stored and logged.
 *   Always returns HTTP 200 (so the extension keeps sending).
 *
 * All other requests return HTTP 200 with an empty body.
 */

const { createSegmentServer } = require('./lib/create-segment-server');
const {
  setCorsHeaders,
  jsonResponse,
  logSegmentEvent,
} = require('./lib/segment-utils');
const { parsePort } = require('./lib/parse-port');

const DEFAULT_PORT = 9090;
const PREFIX = '[segment-collector]';

/** @type {Array<object>} */
const events = [];

const FILTER_PREDICATES = {
  event: (e, value) => e.event === value,
  type: (e, value) => e.type === value,
  category: (e, value) => e.properties?.category === value,
};

// ── Route handlers ─────────────────────────────────────────────────────────

function handleGetEvents(url, response) {
  const params = url.searchParams;
  let filtered = events;

  for (const [param, predicate] of Object.entries(FILTER_PREDICATES)) {
    const value = params.get(param);
    if (value) {
      filtered = filtered.filter((e) => predicate(e, value));
    }
  }

  jsonResponse(response, 200, filtered);
}

function handleGetSummary(_url, response) {
  const byEvent = {};
  for (const event of events) {
    const name = event.event || event.type || 'unknown';
    byEvent[name] = (byEvent[name] || 0) + 1;
  }

  jsonResponse(response, 200, { total: events.length, byEvent });
}

function handleDeleteEvents(response) {
  const count = events.length;
  events.length = 0;
  console.log(`${PREFIX} Cleared ${count} event(s)`);
  jsonResponse(response, 200, { cleared: count });
}

// ── Server hooks ───────────────────────────────────────────────────────────

function onBeforeRequest(request, response, url) {
  const { pathname } = url;

  if (request.method === 'GET' && pathname === '/events/summary') {
    handleGetSummary(url, response);
    return true;
  }

  if (request.method === 'GET' && pathname === '/events') {
    handleGetEvents(url, response);
    return true;
  }

  if (request.method === 'DELETE' && pathname === '/events') {
    handleDeleteEvents(response);
    return true;
  }

  return false;
}

function onBatchRequest(_request, response, batchEvents) {
  const timestamp = new Date().toISOString();

  for (const event of batchEvents) {
    events.push({ receivedAt: timestamp, ...event });
    logSegmentEvent(PREFIX, event);
  }

  if (batchEvents.length > 0) {
    console.log(
      `${PREFIX} Stored ${batchEvents.length} event(s) — total: ${events.length}`,
    );
  }

  setCorsHeaders(response);
  response.statusCode = 200;
  response.end();
}

function onError(error) {
  console.error(`${PREFIX} Server error:`, error);
  process.exit(1);
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let port = process.env.PORT || DEFAULT_PORT;

  while (args.length) {
    if (/^(--port|-p)$/u.test(args[0])) {
      if (args[1] === undefined) {
        throw new Error('Missing port argument');
      }
      port = parsePort(args[1]);
      args.splice(0, 2);
    } else {
      args.shift();
    }
  }

  const server = createSegmentServer(onBatchRequest, onError, {
    onBeforeRequest,
  });

  await server.start(port);

  console.log(`${PREFIX} Listening on port ${port}`);

  const shutdown = () => {
    console.log(
      `\n${PREFIX} Shutting down (${events.length} events collected)`,
    );
    server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
