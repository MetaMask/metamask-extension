import EthJsEns from 'ethjs-ens';
import ensNetworkMap from 'ethereum-ens-network-map';

export default class Ens {
  static getNetworkEnsSupport(network) {
    return Boolean(ensNetworkMap[network]);
  }

  constructor({ network, provider } = {}) {
    this._ethJsEns = new EthJsEns({
      network,
      provider,
    });
  }

  lookup(ensName) {
    return this._ethJsEns.lookup(ensName);
  }

  reverse(address) {
    return this._ethJsEns.reverse(address);
  }
}
