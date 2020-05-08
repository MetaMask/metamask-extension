import createAsyncMiddleware from 'json-rpc-engine/src/createAsyncMiddleware'

export const METHOD_PREFIXES_TO_DRAIN = [
  'wallet_',
  'metamask_',
]

function shouldDrain (methodName = '') {
  for (const prefix of METHOD_PREFIXES_TO_DRAIN) {
    if (methodName.startsWith(prefix)) {
      return true
    }
  }
  return false
}

export default function createSinkMiddleware () {
  return createAsyncMiddleware(async (req, res, next) => {
    if (shouldDrain(req.method)) {
      if (res.result === undefined) {
        res.result = null
      }
      return
    }
    next()
  })
}
