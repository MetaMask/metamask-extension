const uri = 'https://faucet.metamask.io/'
const METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

module.exports = function (address) {
  if (METAMASK_DEBUG) return // Don't faucet in development
  var http = new XMLHttpRequest()
  var data = address
  http.open('POST', uri, true)
  http.setRequestHeader('Content-type', 'application/rawdata')
  http.send(data)
}
