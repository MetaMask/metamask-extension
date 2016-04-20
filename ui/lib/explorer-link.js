module.exports = function(hash, network) {
  let prefix
  switch (network) {
    case 1: // main net
      prefix = ''
    case 2: // morden test net
      prefix = 'testnet.'
    default:
      prefix = ''
  }
  return `http://${prefix}etherscan.io/tx/${hash}`
}
