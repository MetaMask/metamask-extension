const {
  setCorsHeaders,
  jsonResponse,
  getTypeLabel,
  getNameOrId,
  getEventProperties,
  logSegmentEvent,
} = require('./segment-utils');

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

describe('segment-utils', () => {
  describe('setCorsHeaders', () => {
    it('sets Access-Control-Allow-Origin to wildcard', () => {
      const response = createMockResponse();

      setCorsHeaders(response);

      expect(response.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*',
      );
    });

    it('sets Access-Control-Allow-Methods to GET, POST, DELETE, OPTIONS', () => {
      const response = createMockResponse();

      setCorsHeaders(response);

      expect(response.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, DELETE, OPTIONS',
      );
    });

    it('sets Access-Control-Allow-Headers to wildcard', () => {
      const response = createMockResponse();

      setCorsHeaders(response);

      expect(response.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        '*',
      );
    });
  });

  describe('jsonResponse', () => {
    it('sets CORS headers on the response', () => {
      const response = createMockResponse();

      jsonResponse(response, 200, { ok: true });

      expect(response.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*',
      );
    });

    it('sets Content-Type to application/json', () => {
      const response = createMockResponse();

      jsonResponse(response, 200, { ok: true });

      expect(response.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
    });

    it('sets the given status code', () => {
      const response = createMockResponse();

      jsonResponse(response, 404, { error: 'not found' });

      expect(response.statusCode).toBe(404);
    });

    it('writes the JSON-stringified body to the response', () => {
      const response = createMockResponse();
      const body = { total: 3, items: [1, 2, 3] };

      jsonResponse(response, 200, body);

      expect(response.end).toHaveBeenCalledWith(JSON.stringify(body, null, 2));
    });
  });

  describe('getTypeLabel', () => {
    it('returns "Track" for track events', () => {
      expect(getTypeLabel({ type: 'track' })).toBe('Track');
    });

    it('returns "Page" for page events', () => {
      expect(getTypeLabel({ type: 'page' })).toBe('Page');
    });

    it('returns "Identify" for identify events', () => {
      expect(getTypeLabel({ type: 'identify' })).toBe('Identify');
    });

    it('returns "Unknown" for unrecognized event types', () => {
      expect(getTypeLabel({ type: 'foobar' })).toBe('Unknown');
    });

    it('returns "Unknown" when type is undefined', () => {
      expect(getTypeLabel({})).toBe('Unknown');
    });
  });

  describe('getNameOrId', () => {
    it('returns the event name for track events', () => {
      expect(getNameOrId({ type: 'track', event: 'Button Clicked' })).toBe(
        'Button Clicked',
      );
    });

    it('returns "(no name)" for track events without an event name', () => {
      expect(getNameOrId({ type: 'track' })).toBe('(no name)');
    });

    it('returns the page name for page events', () => {
      expect(getNameOrId({ type: 'page', name: 'Home' })).toBe('Home');
    });

    it('returns "(no name)" for page events without a name', () => {
      expect(getNameOrId({ type: 'page' })).toBe('(no name)');
    });

    it('returns the userId for identify events', () => {
      expect(getNameOrId({ type: 'identify', userId: 'user-1' })).toBe(
        'user-1',
      );
    });

    it('falls back to anonymousId for identify events without userId', () => {
      expect(getNameOrId({ type: 'identify', anonymousId: 'anon-42' })).toBe(
        'anon-42',
      );
    });

    it('returns "(no id)" for identify events without userId or anonymousId', () => {
      expect(getNameOrId({ type: 'identify' })).toBe('(no id)');
    });

    it('returns an unrecognized-type message for unknown types', () => {
      expect(getNameOrId({ type: 'alias' })).toBe(
        '[Unrecognized event type: alias]',
      );
    });
  });

  describe('getEventProperties', () => {
    it('returns traits for identify events', () => {
      const traits = { email: 'a@b.com' };
      expect(getEventProperties({ type: 'identify', traits })).toBe(traits);
    });

    it('returns properties for track events', () => {
      const properties = { category: 'Nav' };
      expect(getEventProperties({ type: 'track', properties })).toBe(
        properties,
      );
    });

    it('returns properties for page events', () => {
      const properties = { url: '/home' };
      expect(getEventProperties({ type: 'page', properties })).toBe(properties);
    });

    it('returns undefined when no properties or traits exist', () => {
      expect(getEventProperties({ type: 'track' })).toBeUndefined();
    });
  });

  describe('logSegmentEvent', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('logs type and name for events without properties', () => {
      logSegmentEvent('[test]', { type: 'track', event: 'Click' });

      expect(consoleSpy).toHaveBeenCalledWith('[test] Track: Click');
    });

    it('logs type, name, and formatted properties for events with properties', () => {
      const properties = { category: 'Nav' };
      logSegmentEvent('[test]', {
        type: 'track',
        event: 'Click',
        properties,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `[test] Track: Click\n${JSON.stringify(properties, null, 2)}`,
      );
    });

    it('logs traits for identify events with traits', () => {
      const traits = { plan: 'pro' };
      logSegmentEvent('[test]', {
        type: 'identify',
        userId: 'u1',
        traits,
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        `[test] Identify: u1\n${JSON.stringify(traits, null, 2)}`,
      );
    });

    it('does not include properties block when properties is an empty object', () => {
      logSegmentEvent('[test]', {
        type: 'track',
        event: 'Empty',
        properties: {},
      });

      expect(consoleSpy).toHaveBeenCalledWith('[test] Track: Empty');
    });

    it('does not include properties block when properties is null', () => {
      logSegmentEvent('[test]', {
        type: 'track',
        event: 'Null',
        properties: null,
      });

      expect(consoleSpy).toHaveBeenCalledWith('[test] Track: Null');
    });
  });
});
