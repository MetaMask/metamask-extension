const http = require('http');
const { setCorsHeaders } = require('./segment-utils');

/**
 * This is the default error handler to be used by this mock segment server.
 * It will print the error to the console and exit the process.
 *
 * @param {Error} error - The server error
 */
function defaultOnError(error) {
  console.log(error);
  process.exit(1);
}

/**
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('http').ServerResponse} ServerResponse
 */

/**
 * This function handles requests for the mock Segment server
 *
 * @typedef {(request: IncomingMessage, response: ServerResponse, metricEvents: Array<object>) => void} MockSegmentRequestHandler
 */

/**
 * Creates a HTTP server that acts as a fake version of the Segment API.
 * Returns HTTP 200 to every request, parses batch payloads, and forwards
 * the extracted events to `onRequest`.
 *
 * @param {MockSegmentRequestHandler} onRequest - Called for each request
 *   that is not handled by `options.onBeforeRequest`.
 * @param {(error: Error) => void} [onError] - Server error callback.
 * @param {object} [options]
 * @param {(request: IncomingMessage, response: ServerResponse, url: URL) => boolean} [options.onBeforeRequest]
 *   - Optional hook invoked before body parsing. Return `true` to indicate the
 *   request was handled (the default batch logic will be skipped).
 */
function createSegmentServer(
  onRequest,
  onError = defaultOnError,
  options = {},
) {
  const { onBeforeRequest } = options;

  const server = http.createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      setCorsHeaders(response);
      response.statusCode = 200;
      response.end();
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (onBeforeRequest && onBeforeRequest(request, response, url)) {
      return;
    }

    const chunks = [];
    request.on('data', (chunk) => {
      chunks.push(chunk);
    });

    await new Promise((resolve) => {
      request.on('end', () => {
        resolve();
      });
    });

    let metricEvents = [];
    if (chunks.length) {
      try {
        const body = Buffer.concat(chunks).toString();
        const segmentPayload = JSON.parse(body);
        metricEvents = segmentPayload.batch || [];
      } catch (_) {
        // Malformed or non-JSON payload — treat as zero events
      }
    }

    onRequest(request, response, metricEvents);
  });

  server.on('error', onError);

  return {
    start: async (port) => {
      await new Promise((resolve, reject) => {
        server.listen(port, (error) => {
          if (error) {
            return reject(error);
          }
          return resolve();
        });
      });
    },
    stop: async () => {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            return reject(error);
          }
          return resolve();
        });
        // We need to close all connections to stop the server quickly
        // Otherwise it takes a few seconds for it to close
        server.closeAllConnections();
      });
    },
  };
}

module.exports = { createSegmentServer };
