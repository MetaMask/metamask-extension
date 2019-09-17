const EthJsEns = require('ethjs-ens')
const ensNetworkMap = require('ethjs-ens/lib/network-map.json')

class Ens {
  constructor ({ network, provider } = {}) {
    this._ethJsEns = new EthJsEns({
      network,
      provider,
    })
  }

  lookup (ensName) {
    return this._ethJsEns.lookup(ensName)
  }

  reverse (address) {
    return this._ethJsEns.reverse(address)
  }
}

Ens.getNetworkEnsSupport = function getNetworkEnsSupport (network) {
  return Boolean(ensNetworkMap[network])
}

module.exports = Ens
