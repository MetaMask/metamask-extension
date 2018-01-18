const JsonRpcEngine = require('json-rpc-engine')
const scaffoldMiddleware = require('eth-json-rpc-middleware/scaffold')
const TestBlockchain = require('eth-block-tracker/test/util/testBlockMiddleware')

module.exports = {
  createEngineForTestData,
  providerFromEngine,
  scaffoldMiddleware,
  createTestProviderTools,
}


function createEngineForTestData () {
  return new JsonRpcEngine()
}

function providerFromEngine (engine) {
  const provider = { sendAsync: engine.handle.bind(engine) }
  return provider
}

function createTestProviderTools (opts = {}) {
  const engine = createEngineForTestData()
  const testBlockchain = new TestBlockchain()
  // handle provided hooks
  engine.push(scaffoldMiddleware(opts.scaffold || {}))
  // handle block tracker methods
  engine.push(testBlockchain.createMiddleware())
  const provider = providerFromEngine(engine)
  return { provider, engine, testBlockchain }
}
