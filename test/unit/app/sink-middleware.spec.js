import assert from 'assert'
import sinon from 'sinon'
import pify from 'pify'
import JsonRpcEngine from 'json-rpc-engine'
import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'

import createSinkMiddleware, {
  METHOD_PREFIXES_TO_DRAIN,
  METHODS_TO_DRAIN,
} from '../../../app/scripts/lib/createSinkMiddleware'

const createMockEngine = (fake) => {
  const engine = new JsonRpcEngine()
  engine.handleAsync = pify(engine.handle)

  engine.push(createSinkMiddleware())
  engine.push(createAsyncMiddleware(async (req, res, _next) => {
    fake(req.method)
    res.result = true
    return
  }))

  return engine
}

const createMockPayload = (method) => {
  return {
    method,
    jsonrpc: '2.0',
    id: 1,
  }
}

describe('Sink middleware', function () {

  it('terminates requests for methods with target prefixes', async function () {

    const methods = METHOD_PREFIXES_TO_DRAIN.map((prefix) => prefix + 'foo')

    const fake = sinon.fake()
    const engine = createMockEngine(fake)

    for (const method of methods) {

      const payload = createMockPayload(method)
      const response = await engine.handleAsync(payload)
      assert.ok(fake.notCalled, 'fake should not have been called')
      assert.equal(
        response.result, null,
        'response should have null result'
      )
    }
  })

  it('terminates requests for target methods', async function () {

    const fake = sinon.fake()
    const engine = createMockEngine(fake)

    for (const method of METHODS_TO_DRAIN) {

      const payload = createMockPayload(method)
      const response = await engine.handleAsync(payload)
      assert.ok(fake.notCalled, 'fake should not have been called')
      assert.equal(
        response.result, null,
        'response should have null result'
      )
    }
  })

  it('passes through methods without target prefixes', async function () {

    const method = 'eth_foo'

    const fake = sinon.fake()
    const engine = createMockEngine(fake)

    const payload = createMockPayload(method)
    const response = await engine.handleAsync(payload)
    assert.ok(fake.calledOnce, 'fake should have been called once')
    assert.equal(
      fake.lastCall.args[0], method,
      'fake should have been called with expected arg'
    )
    assert.equal(
      response.result, true,
      'response should have true result'
    )
  })
})
