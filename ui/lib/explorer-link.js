const prefixForNetwork = require('./etherscan-prefix-for-network')

module.exports = function (hash, network, url) {
  if (url) {
    return url.replace('[[txHash]]', hash)
  }

  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/tx/${hash}`
}
