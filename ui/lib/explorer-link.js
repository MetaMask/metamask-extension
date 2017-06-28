module.exports = function (hash, network) {
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
    case 61: // classic net
      return `https://gastracker.io/tx/${hash}`
    default:
      prefix = ''
  }
  return `http://${prefix}etherscan.io/tx/${hash}`
}
