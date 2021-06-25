import { strict as assert } from 'assert';
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
    assert.deepEqual(response, {
      hodl: false,
    });
  });

  it('throws when the request hits a custom timeout', async function () {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(MILLISECOND * 123);

    try {
      await fetchWithTimeout('https://api.infura.io/moon').then((r) =>
        r.json(),
      );
      assert.fail('Request should throw');
    } catch (e) {
      assert.ok(e);
    }
  });

  it('should abort the request when the custom timeout is hit', async function () {
    nock('https://api.infura.io')
      .get('/moon')
      .delay(SECOND * 2)
      .reply(200, '{"moon": "2012-12-21T11:11:11Z"}');

    const fetchWithTimeout = getFetchWithTimeout(MILLISECOND * 123);

    try {
      await fetchWithTimeout('https://api.infura.io/moon').then((r) =>
        r.json(),
      );
      assert.fail('Request should be aborted');
    } catch (e) {
      assert.deepEqual(e.message, 'Aborted');
    }
  });

  it('throws on invalid timeout', async function () {
    assert.throws(() => getFetchWithTimeout(), 'should throw');
    assert.throws(() => getFetchWithTimeout(-1), 'should throw');
    assert.throws(() => getFetchWithTimeout({}), 'should throw');
    assert.throws(() => getFetchWithTimeout(true), 'should throw');
  });
});
