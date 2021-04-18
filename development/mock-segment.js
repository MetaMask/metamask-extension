const { createSegmentServer } = require('./lib/create-segment-server');
const { parsePort } = require('./lib/parse-port');

const DEFAULT_PORT = 9090;
const prefix = '[mock-segment]';

function onRequest(request, response, events) {
  console.log(`${prefix}: ${request.method} ${request.url}`);
  const eventDescriptions = events.map((event) => {
    if (event.type === 'track') {
      return event.event;
    } else if (event.type === 'page') {
      return event.name;
    }
    return `[Unrecognized event type: ${event.type}]`;
  });
  console.log(`${prefix}: Events received: ${eventDescriptions.join(', ')}`);

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
 * SEGMENT_LEGACY_WRITE_KEY=FAKE
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
