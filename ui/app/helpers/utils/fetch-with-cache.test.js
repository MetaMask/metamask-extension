import assert from 'assert'
import nock from 'nock'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const fakeLocalStorageHelpers = {}
const fetchWithCache = proxyquire('./fetch-with-cache', {
  '../../../lib/local-storage-helpers': fakeLocalStorageHelpers,
}).default

describe('Fetch with cache', function () {
  beforeEach(function () {
    fakeLocalStorageHelpers.loadLocalStorageData = sinon.stub()
    fakeLocalStorageHelpers.saveLocalStorageData = sinon.stub()
  })
  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  it('fetches a url', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 1}')

    const response = await fetchWithCache('https://fetchwithcache.metamask.io/price')
    assert.deepEqual(response, {
      average: 1,
    })
  })

  it('returns cached response', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 2}')

    fakeLocalStorageHelpers.loadLocalStorageData.returns({
      'https://fetchwithcache.metamask.io/price': {
        cachedResponse: { average: 1 },
        cachedTime: Date.now(),
      },
    })

    const response = await fetchWithCache('https://fetchwithcache.metamask.io/price')
    assert.deepEqual(response, {
      average: 1,
    })
  })

  it('fetches URL again after cache refresh time has passed', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 3}')

    fakeLocalStorageHelpers.loadLocalStorageData.returns({
      'https://fetchwithcache.metamask.io/cached': {
        cachedResponse: { average: 1 },
        cachedTime: Date.now() - 1000,
      },
    })

    const response = await fetchWithCache('https://fetchwithcache.metamask.io/price', {}, { cacheRefreshTime: 123 })
    assert.deepEqual(response, {
      average: 3,
    })
  })

  it('should abort the request when the custom timeout is hit', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .delay(100)
      .reply(200, '{"average": 4}')

    try {
      await fetchWithCache('https://fetchwithcache.metamask.io/price', {}, { timeout: 20 })
      assert.fail('Request should be aborted')
    } catch (e) {
      assert.deepEqual(e.message, 'Aborted')
    }
  })

  it('throws when the response is unsuccessful', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(500, '{"average": 6}')

    try {
      await fetchWithCache('https://fetchwithcache.metamask.io/price')
      assert.fail('Request should throw')
    } catch (e) {
      assert.ok(e)
    }
  })

  it('throws when a POST request is attempted', async function () {
    nock('https://fetchwithcache.metamask.io')
      .post('/price')
      .reply(200, '{"average": 7}')

    try {
      await fetchWithCache('https://fetchwithcache.metamask.io/price', { method: 'POST' })
      assert.fail('Request should throw')
    } catch (e) {
      assert.ok(e)
    }
  })

  it('throws when the request has a truthy body', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 8}')

    try {
      await fetch('https://fetchwithcache.metamask.io/price', { body: 1 })
      assert.fail('Request should throw')
    } catch (e) {
      assert.ok(e)
    }
  })

  it('throws when the request has an invalid Content-Type header', async function () {
    nock('https://fetchwithcache.metamask.io')
      .get('/price')
      .reply(200, '{"average": 9}')

    try {
      await fetch('https://fetchwithcache.metamask.io/price', { headers: { 'Content-Type': 'text/plain' } })
      assert.fail('Request should throw')
    } catch (e) {
      assert.ok(e)
    }
  })
})
