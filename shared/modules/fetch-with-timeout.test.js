import nock from 'nock';
import { MILLISECOND, SECOND } from '../constants/time';
import getFetchWithTimeout from './fetch-with-timeout';

describe('getFetchWithTimeout', function () {
  it('fetches a url', async function () {
    nock('https://api.infura.io').get('/money').reply(200, '{"hodl": false}');

    const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);
    const response = await (
      await fetchWithTimeout('https://api.infura.io/money')
    ).json();
    expect(response).toStrictEqual({
      hodl: false,
    });
  });

  it('throws when the request hits a custom timeout', async function () {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(MILLISECOND * 123);

    const fetchWithTimeoutThrowsError = async () => {
      await fetchWithTimeout('https://api.infura.io/moon').then((r) =>
        r.json(),
      );
      throw new Error('Request should throw');
    };

    await expect(fetchWithTimeoutThrowsError()).rejects.toThrow(
      'The user aborted a request.',
    );
  });

  it('should abort the request when the custom timeout is hit', async function () {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(MILLISECOND * 123);

    const fetchWithTimeoutThrowsError = async () => {
      await fetchWithTimeout('https://api.infura.io/moon').then((r) =>
        r.json(),
      );
      throw new Error('Request should be aborted');
    };

    await expect(fetchWithTimeoutThrowsError()).rejects.toThrow(
      'The user aborted a request.',
    );
  });

  it('throws on invalid timeout', async function () {
    expect(() => getFetchWithTimeout()).toThrow(
      'Must specify positive integer timeout.',
    );
    expect(() => getFetchWithTimeout(-1)).toThrow(
      'Must specify positive integer timeout.',
    );
    expect(() => getFetchWithTimeout({})).toThrow(
      'Must specify positive integer timeout.',
    );
    expect(() => getFetchWithTimeout(true)).toThrow(
      'Must specify positive integer timeout.',
    );
  });
});
