import {
  EXPECTED_SESSION_KEY,
  getGridPlusConnectApiBaseUrl,
  getGridPlusConnectOrigin,
  getGridPlusConnectPageUrl,
  RESULT_MESSAGE_TYPE,
  RESULT_MESSAGE_VERSION,
  parseGridPlusConnectUrl,
  prepareGridPlusConnectUrl,
  validateGridPlusConnectMessage,
} from './gridplus-connect';

const REQUEST_ID = 'request-1';
const GENERATED_REQUEST_ID = '00000000-0000-4000-8000-000000000001';
const TARGET_ORIGIN = 'chrome-extension://extension-id';

const getConnectUrl = (params: Record<string, string> = {}) => {
  const url = new URL('https://app.gridplus.io/connect');
  url.searchParams.set('client', EXPECTED_SESSION_KEY);
  url.searchParams.set('requestId', REQUEST_ID);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
};

describe('gridplus-connect', () => {
  const originalGridPlusConnectPageUrl = process.env.GRIDPLUS_CONNECT_PAGE_URL;
  const originalGridPlusConnectApiUrl = process.env.GRIDPLUS_CONNECT_API_URL;

  afterEach(() => {
    if (originalGridPlusConnectPageUrl === undefined) {
      delete process.env.GRIDPLUS_CONNECT_PAGE_URL;
    } else {
      process.env.GRIDPLUS_CONNECT_PAGE_URL = originalGridPlusConnectPageUrl;
    }

    if (originalGridPlusConnectApiUrl === undefined) {
      delete process.env.GRIDPLUS_CONNECT_API_URL;
    } else {
      process.env.GRIDPLUS_CONNECT_API_URL = originalGridPlusConnectApiUrl;
    }
  });

  describe('configuration', () => {
    it('uses production GridPlus Connect URLs by default', () => {
      delete process.env.GRIDPLUS_CONNECT_PAGE_URL;
      delete process.env.GRIDPLUS_CONNECT_API_URL;

      expect(getGridPlusConnectPageUrl()).toBe(
        'https://app.gridplus.io/connect',
      );
      expect(getGridPlusConnectOrigin()).toBe('https://app.gridplus.io');
      expect(getGridPlusConnectApiBaseUrl()).toBe('https://api.gridplus.io');
    });

    it('uses configured local GridPlus Connect URLs', () => {
      process.env.GRIDPLUS_CONNECT_PAGE_URL = 'http://localhost:3001';
      process.env.GRIDPLUS_CONNECT_API_URL = 'http://localhost:3000/';

      expect(getGridPlusConnectPageUrl()).toBe('http://localhost:3001/connect');
      expect(getGridPlusConnectOrigin()).toBe('http://localhost:3001');
      expect(getGridPlusConnectApiBaseUrl()).toBe('http://localhost:3000');
    });
  });

  describe('parseGridPlusConnectUrl', () => {
    it('parses a valid connect URL', () => {
      const result = parseGridPlusConnectUrl(getConnectUrl());

      expect(result.expectedOrigin).toBe('https://app.gridplus.io');
      expect(result.expectedClient).toBe(EXPECTED_SESSION_KEY);
      expect(result.expectedRequestId).toBe(REQUEST_ID);
    });

    it('rejects an unexpected origin', () => {
      expect(() =>
        parseGridPlusConnectUrl('https://lattice.gridplus.io/connect'),
      ).toThrow('Unexpected connect origin: https://lattice.gridplus.io');
    });

    it('accepts a configured local Connect origin', () => {
      process.env.GRIDPLUS_CONNECT_PAGE_URL = 'http://localhost:3001/connect';
      const url = new URL('http://localhost:3001/connect');
      url.searchParams.set('client', EXPECTED_SESSION_KEY);
      url.searchParams.set('requestId', REQUEST_ID);

      const result = parseGridPlusConnectUrl(url.toString());

      expect(result.expectedOrigin).toBe('http://localhost:3001');
    });

    it('rejects an unexpected client', () => {
      expect(() =>
        parseGridPlusConnectUrl(getConnectUrl({ client: 'other-client' })),
      ).toThrow('Unexpected connect client: other-client');
    });

    it('rejects a missing requestId', () => {
      const url = new URL(getConnectUrl());
      url.searchParams.delete('requestId');

      expect(() => parseGridPlusConnectUrl(url.toString())).toThrow(
        'Missing requestId in connect URL.',
      );
    });
  });

  describe('prepareGridPlusConnectUrl', () => {
    it('adds v1 Connect parameters', () => {
      const result = prepareGridPlusConnectUrl(getConnectUrl(), TARGET_ORIGIN);

      expect(result.url.searchParams.get('v')).toBe(
        String(RESULT_MESSAGE_VERSION),
      );
      expect(result.url.searchParams.get('targetOrigin')).toBe(TARGET_ORIGIN);
      expect(result.url.searchParams.get('forceLogin')).toBe('true');
      expect(result.url.searchParams.get('return')).toBe('close');
    });

    it('adds a requestId when the keyring URL does not include one', () => {
      jest.spyOn(crypto, 'randomUUID').mockReturnValue(GENERATED_REQUEST_ID);

      const url = new URL(getConnectUrl());
      url.searchParams.delete('requestId');
      const result = prepareGridPlusConnectUrl(url.toString(), TARGET_ORIGIN);

      expect(result.expectedRequestId).toBe(GENERATED_REQUEST_ID);
    });
  });

  describe('validateGridPlusConnectMessage', () => {
    const validate = (data: unknown) =>
      validateGridPlusConnectMessage(data, {
        expectedClient: EXPECTED_SESSION_KEY,
        expectedRequestId: REQUEST_ID,
      });

    const validMessage = {
      type: RESULT_MESSAGE_TYPE,
      v: RESULT_MESSAGE_VERSION,
      requestId: REQUEST_ID,
      client: EXPECTED_SESSION_KEY,
      ok: true,
      sessionKey: EXPECTED_SESSION_KEY,
      deviceId: 'device-1',
      deviceType: 'lattice',
    };

    it('accepts a valid success result', () => {
      expect(validate(validMessage)).toStrictEqual({
        status: 'success',
        result: {
          deviceId: 'device-1',
          sessionKey: EXPECTED_SESSION_KEY,
          deviceType: 'lattice',
        },
      });
    });

    (
      [
        ['non-object data', null],
        ['wrong type', { ...validMessage, type: 'other' }],
        ['wrong version', { ...validMessage, v: 2 }],
        ['wrong requestId', { ...validMessage, requestId: 'other-request' }],
      ] satisfies [string, unknown][]
    ).forEach(([label, data]) => {
      it(`ignores ${label}`, () => {
        expect(validate(data)).toStrictEqual({ status: 'ignore' });
      });
    });

    it('rejects a wrong client', () => {
      expect(validate({ ...validMessage, client: 'other-client' })).toStrictEqual(
        {
          status: 'error',
          error: 'Invalid client returned from Connect.',
        },
      );
    });

    it('rejects a wrong sessionKey', () => {
      expect(
        validate({ ...validMessage, sessionKey: 'other-session' }),
      ).toStrictEqual({
        status: 'error',
        error: 'Invalid sessionKey returned from Connect.',
      });
    });

    it('rejects a failed result with a reason', () => {
      expect(
        validate({ ...validMessage, ok: false, reason: 'User rejected.' }),
      ).toStrictEqual({
        status: 'error',
        error: 'User rejected.',
      });
    });

    it('rejects a missing deviceId', () => {
      expect(validate({ ...validMessage, deviceId: undefined })).toStrictEqual({
        status: 'error',
        error: 'Invalid credentials returned from Connect.',
      });
    });
  });
});
