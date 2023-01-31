const http = require('http');

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
 * The bevahiour is rudimentary at the moment - it returns HTTP 200 in response
 * to every request. The only function this serves is to spy on requests sent to
 * this server, and to parse the request payloads as Segment batch events.
 *
 * @param {MockSegmentRequestHandler} onRequest - A callback for each request the server receives.
 * @param {(error: Error) => void} [onError] - A callback for server error events
 */
function createSegmentServer(onRequest, onError = defaultOnError) {
  const server = http.createServer(async (request, response) => {
    const chunks = [];

    request.on('data', (chunk) => {
      chunks.push(chunk);
    });

    await new Promise((resolve) => {
      request.on('end', () => {
        resolve();
      });
    });

    // respond to preflight request
    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Origin', '*');
      response.setHeader('Access-Control-Allow-Methods', '*');
      response.setHeader('Access-Control-Allow-Headers', '*');
      response.statusCode = 200;
      response.end();
      return;
    }

    let metricEvents = [];
    if (chunks.length) {
      const body = Buffer.concat(chunks).toString();
      const segmentPayload = JSON.parse(body);
      metricEvents = segmentPayload.batch;
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
      });
    },
  };
}

module.exports = { createSegmentServer };
