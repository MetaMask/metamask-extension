import { createTestProviderTools, providerResultStub } from '../stub/provider';
import JsonRpcSpec from '@metamask/api-specs';


export async function fuzz(data) {
  const engine  = createTestProviderTools({
    scaffold: providerResultStub,
    networkId: 1,
    chainId: 1,
    logging: { quiet: true }
  }).engine

  let request = {
      id: 1,
      jsonrpc: '2.0',
  }

  const promises = []

  JsonRpcSpec.methods.forEach((method) => {
    request.method = method.name
    request.params = data.toString()
    promises.push(engine.handle(request))
  })

    return Promise.all(promises)
      .then((results) => {
        results.forEach((result) => {
          if (result.error && !ignoredError(result.error.message)) {
            throw result.error.message
          }
        })
      })
}

function ignoredError(error) {
  return !!ignored.find((message) => error.includes(message))
}

const ignored = [
  'does not exist/is not available',
  'Incorrect number of arguments.',
  'CreateListFromArrayLike called on non-object',
]