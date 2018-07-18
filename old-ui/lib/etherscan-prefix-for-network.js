module.exports = function (network) {
  const net = parseInt(network)
  let prefix
  switch (net) {
    case 1: // main net
      prefix = ''
      break
    case 3: // ropsten test net
      prefix = 'ropsten.'
      break
    case 4: // rinkeby test net
      prefix = 'rinkeby.'
      break
    case 42: // kovan test net
      prefix = 'kovan.'
      break
    case 99: // poa net
      console.warn('Do not use etherscan for POA Network')
      prefix = ''
      break
    default:
      prefix = ''
  }
  return prefix
}
