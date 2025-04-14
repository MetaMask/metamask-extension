import nock from 'nock';
import { MILLISECOND, SECOND } from '../constants/time';
import getFetchWithTimeout from './fetch-with-timeout';

describe('getFetchWithTimeout', () => {
  it('fetches a url', async () => {
    nock('https://api.infura.io').get('/money').reply(200, '{"hodl": false}');

    const fetchWithTimeout = getFetchWithTimeout();
    const response = await (
      await fetchWithTimeout('https://api.infura.io/money')
    ).json();
    expect(response).toStrictEqual({
      hodl: false,
    });
  });

  it('throws when the request hits a custom timeout', async () => {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(MILLISECOND * 123);

    await expect(async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
      await fetchWithTimeout('https://api.infura.io/moon').then(async (r) =>
        r.json(),
      );
    }).rejects.toThrow('The user aborted a request.');
  });

  it('should abort the request when the custom timeout is hit', async () => {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(MILLISECOND * 123);

    await expect(async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
      await fetchWithTimeout('https://api.infura.io/moon').then(async (r) =>
        r.json(),
      );
    }).rejects.toThrow('The user aborted a request.');
  });

  it('should abort the request when a custom signal aborts', async () => {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');
    const abortSignal = new window.AbortController();

    const fetchWithTimeout = getFetchWithTimeout(SECOND * 30);

    setTimeout(() => abortSignal.abort('Request aborted'), SECOND * 2);
    await expect(async () => {
      await fetchWithTimeout('https://api.infura.io/moon', {
        signal: abortSignal.signal,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
      }).then(async (r) => r.json());
    }).rejects.toThrow('The user aborted a request.');
  });

  it('throws on invalid timeout', async () => {
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(() => getFetchWithTimeout(-1)).toThrow(
      'Must specify positive integer timeout.',
    );
    // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31881
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await expect(() => getFetchWithTimeout(true)).toThrow(
      'Must specify positive integer timeout.',
    );
  });
});
