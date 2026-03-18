const http = require('http');
const { createSegmentServer } = require('./create-segment-server');

function getAvailablePort() {
  return new Promise((resolve) => {
    const tmp = http.createServer();
    tmp.listen(0, 'localhost', () => {
      const { port } = tmp.address();
      tmp.close(() => resolve(port));
    });
  });
}

function request(port, { method = 'GET', path = '/', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: 'localhost', port, path, method },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString(),
          });
        });
      },
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

describe('createSegmentServer', () => {
  let server;
  let port;

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
  });

  describe('OPTIONS requests', () => {
    it('responds with 200 and CORS headers', async () => {
      const onRequest = jest.fn();
      port = await getAvailablePort();
      server = createSegmentServer(onRequest);
      await server.start(port);

      const res = await request(port, { method: 'OPTIONS' });

      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['access-control-allow-headers']).toBe('*');
      expect(onRequest).not.toHaveBeenCalled();
    });
  });

  describe('batch requests', () => {
    it('parses a valid JSON batch body and forwards events to onRequest', async () => {
      const onRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end();
      });
      port = await getAvailablePort();
      server = createSegmentServer(onRequest);
      await server.start(port);

      const batch = [
        { type: 'track', event: 'Test' },
        { type: 'page', name: 'Home' },
      ];

      await request(port, {
        method: 'POST',
        path: '/v1/batch',
        body: { batch },
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      const events = onRequest.mock.calls[0][2];
      expect(events).toStrictEqual(batch);
    });

    it('treats malformed JSON as zero events', async () => {
      const onRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end();
      });
      port = await getAvailablePort();
      server = createSegmentServer(onRequest);
      await server.start(port);

      await request(port, {
        method: 'POST',
        path: '/v1/batch',
        body: '{not valid json',
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      const events = onRequest.mock.calls[0][2];
      expect(events).toStrictEqual([]);
    });

    it('treats an empty body as zero events', async () => {
      const onRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end();
      });
      port = await getAvailablePort();
      server = createSegmentServer(onRequest);
      await server.start(port);

      await request(port, { method: 'POST', path: '/v1/batch' });

      expect(onRequest).toHaveBeenCalledTimes(1);
      const events = onRequest.mock.calls[0][2];
      expect(events).toStrictEqual([]);
    });

    it('defaults batch to empty array when payload has no batch field', async () => {
      const onRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end();
      });
      port = await getAvailablePort();
      server = createSegmentServer(onRequest);
      await server.start(port);

      await request(port, {
        method: 'POST',
        path: '/v1/batch',
        body: { other: 'data' },
      });

      expect(onRequest).toHaveBeenCalledTimes(1);
      const events = onRequest.mock.calls[0][2];
      expect(events).toStrictEqual([]);
    });
  });

  describe('onBeforeRequest hook', () => {
    it('skips batch logic when onBeforeRequest returns true', async () => {
      const onRequest = jest.fn();
      const onBeforeRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end('intercepted');
        return true;
      });

      port = await getAvailablePort();
      server = createSegmentServer(onRequest, undefined, { onBeforeRequest });
      await server.start(port);

      const res = await request(port, {
        method: 'GET',
        path: '/custom-route',
      });

      expect(res.body).toBe('intercepted');
      expect(onBeforeRequest).toHaveBeenCalledTimes(1);
      expect(onRequest).not.toHaveBeenCalled();
    });

    it('falls through to batch logic when onBeforeRequest returns false', async () => {
      const onRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end();
      });
      const onBeforeRequest = jest.fn(() => false);

      port = await getAvailablePort();
      server = createSegmentServer(onRequest, undefined, { onBeforeRequest });
      await server.start(port);

      await request(port, { method: 'POST', path: '/v1/batch' });

      expect(onBeforeRequest).toHaveBeenCalledTimes(1);
      expect(onRequest).toHaveBeenCalledTimes(1);
    });

    it('passes the parsed URL to onBeforeRequest', async () => {
      const onRequest = jest.fn((_req, res) => {
        res.statusCode = 200;
        res.end();
      });
      const onBeforeRequest = jest.fn(() => false);

      port = await getAvailablePort();
      server = createSegmentServer(onRequest, undefined, { onBeforeRequest });
      await server.start(port);

      await request(port, { method: 'GET', path: '/events?type=track' });

      const url = onBeforeRequest.mock.calls[0][2];
      expect(url).toBeInstanceOf(URL);
      expect(url.pathname).toBe('/events');
      expect(url.searchParams.get('type')).toBe('track');
    });
  });

  describe('server lifecycle', () => {
    it('starts and stops without errors', async () => {
      const onRequest = jest.fn();
      port = await getAvailablePort();
      server = createSegmentServer(onRequest);

      await server.start(port);
      await server.stop();
      server = null;
    });
  });
});
