const JsonRpcEngine = require('json-rpc-engine')
const scaffoldMiddleware = require('eth-json-rpc-middleware/scaffold')

module.exports = {
  createEngineForTestData,
  providerFromEngine,
  scaffoldMiddleware,
  createStubedProvider
}


function createEngineForTestData () {
  return new JsonRpcEngine()
}

function providerFromEngine (engine) {
  const provider = { sendAsync: engine.handle.bind(engine) }
  return provider
}

function createStubedProvider (resultStub) {
  const engine = createEngineForTestData()
  engine.push(scaffoldMiddleware(resultStub))
  return providerFromEngine(engine)
}