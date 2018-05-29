module.exports = createProviderMiddleware

/**
 * Forwards an HTTP request to the current Web3 provider
 *
 * @param {{ provider: Object }} config Configuration containing current Web3 provider
 */
function createProviderMiddleware ({ provider }) {
  return (req, res, next, end) => {
    provider.sendAsync(req, (err, _res) => {
      if (err) return end(err)
      res.result = _res.result
      end()
    })
  }
}
