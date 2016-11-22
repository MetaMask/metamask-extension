module.exports = function(address, network) {
  const net = parseInt(network)
  let link

  switch (net) {
    case 1: // main net
      link = `http://etherscan.io/address/${address}`
      break
    case 2: // morden test net
      link = `http://morden.etherscan.io/address/${address}`
      break
    case 3: // ropsten test net
      link = `http://testnet.etherscan.io/address/${address}`
      break
    default:
      link = ''
      break
  }

  return link
}
