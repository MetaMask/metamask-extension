const {
  events,
  FILTER_PREDICATES,
  handleGetEvents,
  handleGetSummary,
  handleDeleteEvents,
  onBeforeRequest,
  onBatchRequest,
} = require('./mock-segment-collector');

function createMockResponse() {
  const headers = {};
  return {
    headers,
    statusCode: 0,
    setHeader: jest.fn((key, value) => {
      headers[key] = value;
    }),
    end: jest.fn(),
  };
}

function createMockUrl(path, params = {}) {
  const url = new URL(path, 'http://localhost:9090');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function seedEvents(items) {
  events.length = 0;
  events.push(...items);
}

describe('mock-segment-collector', () => {
  afterEach(() => {
    events.length = 0;
  });

  describe('FILTER_PREDICATES', () => {
    it('filters by event name', () => {
      const ev = { event: 'Transaction Submitted' };
      expect(FILTER_PREDICATES.event(ev, 'Transaction Submitted')).toBe(true);
      expect(FILTER_PREDICATES.event(ev, 'Other')).toBe(false);
    });

    it('filters by type', () => {
      const ev = { type: 'track' };
      expect(FILTER_PREDICATES.type(ev, 'track')).toBe(true);
      expect(FILTER_PREDICATES.type(ev, 'page')).toBe(false);
    });

    it('filters by properties.category', () => {
      const ev = { properties: { category: 'Transactions' } };
      expect(FILTER_PREDICATES.category(ev, 'Transactions')).toBe(true);
      expect(FILTER_PREDICATES.category(ev, 'Other')).toBe(false);
    });

    it('returns false for category filter when properties is undefined', () => {
      expect(FILTER_PREDICATES.category({}, 'Transactions')).toBe(false);
    });
  });

  describe('handleGetEvents', () => {
    it('returns all events when no filters are provided', () => {
      seedEvents([
        { type: 'track', event: 'A' },
        { type: 'page', name: 'B' },
      ]);
      const response = createMockResponse();

      handleGetEvents(createMockUrl('/events'), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toHaveLength(2);
    });

    it('filters events by event name', () => {
      seedEvents([
        { type: 'track', event: 'Click' },
        { type: 'track', event: 'Submit' },
      ]);
      const response = createMockResponse();

      handleGetEvents(createMockUrl('/events', { event: 'Click' }), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toHaveLength(1);
      expect(body[0].event).toBe('Click');
    });

    it('filters events by type', () => {
      seedEvents([
        { type: 'track', event: 'A' },
        { type: 'page', name: 'Home' },
        { type: 'track', event: 'B' },
      ]);
      const response = createMockResponse();

      handleGetEvents(createMockUrl('/events', { type: 'page' }), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toHaveLength(1);
      expect(body[0].type).toBe('page');
    });

    it('filters events by category', () => {
      seedEvents([
        { type: 'track', event: 'A', properties: { category: 'Nav' } },
        { type: 'track', event: 'B', properties: { category: 'Tx' } },
      ]);
      const response = createMockResponse();

      handleGetEvents(createMockUrl('/events', { category: 'Tx' }), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toHaveLength(1);
      expect(body[0].event).toBe('B');
    });

    it('combines multiple filters', () => {
      seedEvents([
        { type: 'track', event: 'A', properties: { category: 'Nav' } },
        { type: 'track', event: 'B', properties: { category: 'Nav' } },
        { type: 'page', event: 'A', properties: { category: 'Nav' } },
      ]);
      const response = createMockResponse();

      handleGetEvents(
        createMockUrl('/events', { type: 'track', category: 'Nav' }),
        response,
      );

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toHaveLength(2);
    });

    it('returns an empty array when no events match', () => {
      seedEvents([{ type: 'track', event: 'A' }]);
      const response = createMockResponse();

      handleGetEvents(
        createMockUrl('/events', { event: 'NonExistent' }),
        response,
      );

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toStrictEqual([]);
    });
  });

  describe('handleGetSummary', () => {
    it('returns total count and events grouped by name', () => {
      seedEvents([
        { event: 'Click', type: 'track' },
        { event: 'Click', type: 'track' },
        { event: 'Submit', type: 'track' },
      ]);
      const response = createMockResponse();

      handleGetSummary(createMockUrl('/events/summary'), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body.total).toBe(3);
      expect(body.byEvent).toStrictEqual({ Click: 2, Submit: 1 });
    });

    it('falls back to type or "unknown" when event name is missing', () => {
      seedEvents([{ type: 'page' }, {}]);
      const response = createMockResponse();

      handleGetSummary(createMockUrl('/events/summary'), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body.total).toBe(2);
      expect(body.byEvent).toStrictEqual({ page: 1, unknown: 1 });
    });

    it('returns zero total when no events exist', () => {
      const response = createMockResponse();

      handleGetSummary(createMockUrl('/events/summary'), response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toStrictEqual({ total: 0, byEvent: {} });
    });
  });

  describe('handleDeleteEvents', () => {
    it('clears all stored events and returns the count', () => {
      jest.spyOn(console, 'log').mockImplementation();
      seedEvents([{ type: 'track' }, { type: 'page' }]);
      const response = createMockResponse();

      handleDeleteEvents(response);

      const body = JSON.parse(response.end.mock.calls[0][0]);
      expect(body).toStrictEqual({ cleared: 2 });
      expect(events).toHaveLength(0);
      console.log.mockRestore();
    });
  });

  describe('onBeforeRequest', () => {
    it('routes GET /events/summary and returns true', () => {
      const response = createMockResponse();
      const url = createMockUrl('/events/summary');

      const handled = onBeforeRequest({ method: 'GET' }, response, url);

      expect(handled).toBe(true);
    });

    it('routes GET /events and returns true', () => {
      const response = createMockResponse();
      const url = createMockUrl('/events');

      const handled = onBeforeRequest({ method: 'GET' }, response, url);

      expect(handled).toBe(true);
    });

    it('routes DELETE /events and returns true', () => {
      jest.spyOn(console, 'log').mockImplementation();
      const response = createMockResponse();
      const url = createMockUrl('/events');

      const handled = onBeforeRequest({ method: 'DELETE' }, response, url);

      expect(handled).toBe(true);
      console.log.mockRestore();
    });

    it('returns false for unmatched routes', () => {
      const response = createMockResponse();
      const url = createMockUrl('/v1/batch');

      const handled = onBeforeRequest({ method: 'POST' }, response, url);

      expect(handled).toBe(false);
    });

    it('returns false for GET on an unknown path', () => {
      const response = createMockResponse();
      const url = createMockUrl('/unknown');

      const handled = onBeforeRequest({ method: 'GET' }, response, url);

      expect(handled).toBe(false);
    });
  });

  describe('onBatchRequest', () => {
    it('stores received events with a receivedAt timestamp', () => {
      jest.spyOn(console, 'log').mockImplementation();
      const response = createMockResponse();
      const batchEvents = [
        { type: 'track', event: 'Click' },
        { type: 'page', name: 'Home' },
      ];

      onBatchRequest({}, response, batchEvents);

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({ type: 'track', event: 'Click' });
      expect(events[0].receivedAt).toBeDefined();
      expect(events[1]).toMatchObject({ type: 'page', name: 'Home' });
      console.log.mockRestore();
    });

    it('responds with 200 and CORS headers', () => {
      jest.spyOn(console, 'log').mockImplementation();
      const response = createMockResponse();

      onBatchRequest({}, response, [{ type: 'track', event: 'A' }]);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.end).toHaveBeenCalled();
      console.log.mockRestore();
    });

    it('does not log a storage summary when batch is empty', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const response = createMockResponse();

      onBatchRequest({}, response, []);

      const storedCalls = logSpy.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('Stored'),
      );
      expect(storedCalls).toHaveLength(0);
      logSpy.mockRestore();
    });

    it('accumulates events across multiple calls', () => {
      jest.spyOn(console, 'log').mockImplementation();
      const response = createMockResponse();

      onBatchRequest({}, response, [{ type: 'track', event: 'A' }]);
      onBatchRequest({}, response, [{ type: 'track', event: 'B' }]);

      expect(events).toHaveLength(2);
      console.log.mockRestore();
    });
  });
});
