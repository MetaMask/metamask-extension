import nock from 'nock';
import sinon from 'sinon';

import { getStorageItem, setStorageItem } from './storage-helpers';

jest.mock('./storage-helpers', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

const fetchWithCache = require('./fetch-with-cache').default;

describe('Fetch with cache', () => {
  afterEach(() => {
    sinon.restore();
    nock.cleanAll();
  });

  it('fetches a url', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 1}');

    const response = await fetchWithCache({
      url: 'https://fetchwithcache.metamask.io/price',
      functionName: 'fetchPrice',
    });

    expect(response).toStrictEqual({
      average: 1,
    });
  });

  it('returns cached response', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 2}');

    getStorageItem.mockReturnValueOnce({
      cachedResponse: { average: 1 },
      cachedTime: Date.now(),
    });

    const response = await fetchWithCache({
      url: 'https://fetchwithcache.metamask.io/price',
      functionName: 'fetchPrice',
    });
    expect(response).toStrictEqual({
      average: 1,
    });
  });

  it('fetches URL again after cache refresh time has passed', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 3}');

    getStorageItem.mockReturnValueOnce({
      cachedResponse: { average: 1 },
      cachedTime: Date.now() - 1000,
    });

    const response = await fetchWithCache({
      url: 'https://fetchwithcache.metamask.io/price',
      cacheOptions: { cacheRefreshTime: 123 },
      functionName: 'fetchPrice',
    });
    expect(response).toStrictEqual({
      average: 3,
    });
  });

  it('should abort the request when the custom timeout is hit', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .delay(100)
      .reply(200, '{"average": 4}');

    await expect(() =>
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/price',
        cacheOptions: { timeout: 20 },
        functionName: 'fetchPrice',
      }),
    ).rejects.toThrow({
      name: 'AbortError',
      message: 'The user aborted a request.',
    });
  });

  it('throws when the response is unsuccessful', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(500, '{"average": 6}');

    await expect(() =>
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/price',
        functionName: 'fetchPrice',
      }),
    ).rejects.toThrow('');
  });

  it('throws when a POST request is attempted', async () => {
    nock('https://fetchwithcache.metamask.io')
      .post('/price')
      .reply(200, '{"average": 7}');

    await expect(() =>
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/price',
        fetchOptions: { method: 'POST' },
        functionName: 'fetchPrice',
      }),
    ).rejects.toThrow('');
  });

  it('throws when the request has a truthy body', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 8}');

    await expect(() =>
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/price',
        fetchOptions: { body: 1 },
        functionName: 'fetchPrice',
      }),
    ).rejects.toThrow('');
  });

  it('throws when the request has an invalid Content-Type header', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 9}');

    await expect(() =>
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/price',
        fetchOptions: { headers: { 'Content-Type': 'text/plain' } },
        functionName: 'fetchPrice',
      }),
    ).rejects.toThrow({
      message: 'fetchWithCache only supports JSON responses',
    });
  });

  it('should correctly cache responses from interwoven requests', async () => {
    nock('https://fetchwithcache.metamask.io')
      .get('/foo')
      .reply(200, '{"average": 9}');

    nock('https://fetchwithcache.metamask.io')
      .get('/bar')
      .reply(200, '{"average": 9}');

    const testCache = {};
    getStorageItem.mockImplementation((key) => testCache[key]);
    setStorageItem.mockImplementation((key, value) => {
      testCache[key] = value;
    });

    await Promise.all([
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/foo',
        cacheOptions: { cacheRefreshTime: 123 },
        functionName: 'fetchFoo',
      }),
      fetchWithCache({
        url: 'https://fetchwithcache.metamask.io/bar',
        cacheOptions: { cacheRefreshTime: 123 },
        functionName: 'fetchFoo',
      }),
    ]);

    expect(
      testCache['cachedFetch:https://fetchwithcache.metamask.io/foo']
        .cachedResponse,
    ).toStrictEqual({ average: 9 });
    expect(
      testCache['cachedFetch:https://fetchwithcache.metamask.io/bar']
        .cachedResponse,
    ).toStrictEqual({ average: 9 });
  });
});
