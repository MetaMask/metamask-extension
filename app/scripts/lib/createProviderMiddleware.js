
module.exports = createProviderMiddleware

// forward requests to provider
function createProviderMiddleware({ provider }) {
  return (req, res, next, end) => {
    provider.sendAsync(req, (err, _res) => {
      if (err) return end(err)
      res.result = _res.result
      end()
    })
  }
}