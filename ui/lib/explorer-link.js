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
    case 42: // kovan test net
      prefix = 'kovan.'
      break
    default:
      prefix = ''
  }
  return `http://${prefix}etherscan.io/tx/${hash}`
}
