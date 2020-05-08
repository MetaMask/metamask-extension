import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'
import log from 'loglevel'

export const METHOD_PREFIXES_TO_DRAIN = [
  'wallet_',
  'metamask_',
]

export const METHODS_TO_DRAIN = new Set([
  'eth_requestAccounts',
])

function shouldDrain (methodName = '') {
  for (const prefix of METHOD_PREFIXES_TO_DRAIN) {
    if (methodName.startsWith(prefix)) {
      return true
    }
  }
  return METHODS_TO_DRAIN.has(methodName)
}

export default function createSinkMiddleware () {
  return createAsyncMiddleware(async (req, res, next) => {
    if (shouldDrain(req.method)) {
      log.warn(`Sink Middleware: Draining request for '${req.method}'`)
      if (res.result === undefined) {
        res.result = null
      }
      return
    }
    next()
  })
}
