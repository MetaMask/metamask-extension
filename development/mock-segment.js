#!/usr/bin/env node
const { createSegmentServer } = require('./lib/create-segment-server');
const { parsePort } = require('./lib/parse-port');

const DEFAULT_PORT = 9090;
const prefix = '[mock-segment]';

function onRequest(_request, response, events) {
  const getDescription = (e) => {
    switch (e.type) {
      case 'track':
        return e.event || '(no name)';
      case 'page':
        return e.name || '(no name)';
      default:
        return `[Unrecognized event type: ${e.type}]`;
    }
  };

  events.forEach((event) => {
    const properties = event && event.properties ? event.properties : undefined;
    const hasProperties =
      properties &&
      typeof properties === 'object' &&
      Object.keys(properties).length > 0;
    if (!hasProperties) {
      return;
    }
    const name = getDescription(event);
    console.log(`${prefix}: ${name}`);
    try {
      console.log(JSON.stringify(properties, null, 2));
    } catch (_) {
      console.log(String(properties));
    }
  });

  response.statusCode = 200;
  response.end();
}

function onError(error) {
  console.error(error);
  process.exit(1);
}

/**
 * This is a mock Segment API meant to be run from the command line. It will start a server
 * with the port specified, and respond with HTTP 200 to all requests. Any requests will be
 * logged to the console, along with the parsed Segment events included in the request (if
 * any)
 *
 * This can be used with the MetaMask extension by setting the `SEGMENT_HOST` environment
 * variable or config entry when building MetaMask.
 *
 * For example, to build MetaMask for use with this mock Segment server, you could set the
 * following values in `.metamaskrc` before building:
 *
 * SEGMENT_HOST='http://localhost:9090'
 * SEGMENT_WRITE_KEY=FAKE
 *
 * Note that the Segment keys must also be set - otherwise the extension will not send any
 * metric events.
 */
const main = async () => {
  const args = process.argv.slice(2);

  let port = process.env.port || DEFAULT_PORT;

  while (args.length) {
    if (/^(--port|-p)$/u.test(args[0])) {
      if (args[1] === undefined) {
        throw new Error('Missing port argument');
      }
      port = parsePort(args[1]);
      args.splice(0, 2);
    }
  }

  const server = createSegmentServer(onRequest, onError);

  await server.start(port);
  console.log(`${prefix}: Listening on port ${port}`);
};

main().catch(onError);
