var uri = 'https://faucet.metamask.io/'

module.exports = function(address) {

  var http = new XMLHttpRequest()
  var data = address
  http.open('POST', uri, true)
  http.setRequestHeader('Content-type', 'application/rawdata')
  http.send(data)

}
