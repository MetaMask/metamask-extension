const JsonRpcEngine = require('json-rpc-engine')
const scaffoldMiddleware = require('eth-json-rpc-middleware/scaffold')

module.exports = {
  createEngineForTestData,
  providerFromEngine,
  scaffoldMiddleware,
  createEthJsQueryStub,
  createStubedProvider,
}


function createEngineForTestData () {
  return new JsonRpcEngine()
}

function providerFromEngine (engine) {
  const provider = { sendAsync: engine.handle.bind(engine) }
  return provider
}

function createEthJsQueryStub (stubProvider) {
  return new Proxy({}, {
    get: (obj, method) => {
      return (...params) => {
        return new Promise((resolve, reject) => {
          stubProvider.sendAsync({ method: `eth_${method}`, params }, (err, res) => err ? reject(err) : resolve(res.result))
        })
      }
    },
  })
}

function createStubedProvider (resultStub) {
  const engine = createEngineForTestData()
  engine.push(scaffoldMiddleware(resultStub))
  return providerFromEngine(engine)
}
