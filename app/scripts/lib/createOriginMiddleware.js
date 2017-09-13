// append dapp origin domain to request
module.exports = createOriginMiddleware

function createOriginMiddleware({ origin }) {
  return function originMiddleware (req, res, next, end) {
    req.origin = originDomain
    next()
  }
}