module.exports = function (hash, network) {
  const net = parseInt(network)
  let prefix
  switch (net) {
    case 1: // main net
      prefix = ''
      break
    case 3: // morden test net
      prefix = 'testnet.'
      break
    default:
      prefix = ''
  }
  return `http://${prefix}etherscan.io/tx/${hash}`
}
