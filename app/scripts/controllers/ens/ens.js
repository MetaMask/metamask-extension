import { Web3Provider } from '@ethersproject/providers';
import ensNetworkMap from 'ethereum-ens-network-map';
import { NETWORK_ID_TO_ETHERS_NETWORK_NAME_MAP } from '../../../../shared/constants/network';

export default class Ens {
  static getNetworkEnsSupport(network) {
    return Boolean(ensNetworkMap[network]);
  }

  constructor({ network, provider } = {}) {
    const networkName = NETWORK_ID_TO_ETHERS_NETWORK_NAME_MAP[network];
    const ensAddress = ensNetworkMap[network];
    const ethProvider = new Web3Provider(provider, {
      chainId: parseInt(network, 10),
      name: networkName,
      ensAddress,
    });
    this._ethProvider = ethProvider;
  }

  lookup(ensName) {
    return this._ethProvider.resolveName(ensName);
  }

  reverse(address) {
    return this._ethProvider.lookupAddress(address);
  }
}
