const uri = 'https://faucet.metamask.io/'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'
const env = process.env.METAMASK_ENV

module.exports = function (address) {
  if (METAMASK_DEBUG || env === 'test') return // Don't faucet in development or test
  var http = new XMLHttpRequest()
  var data = address
  http.open('POST', uri, true)
  http.setRequestHeader('Content-type', 'application/rawdata')
  http.send(data)
}
