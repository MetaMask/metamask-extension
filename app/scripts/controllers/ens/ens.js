import { Web3Provider } from '@ethersproject/providers';
import ensNetworkMap from 'ethereum-ens-network-map';
import { CHAIN_ID_TO_ETHERS_NETWORK_NAME_MAP } from '../../../../shared/constants/network';

export default class Ens {
  static getChainEnsSupport(chainId) {
    return Boolean(ensNetworkMap[parseInt(chainId, 16).toString()]);
  }

  constructor({ chainId, provider } = {}) {
    const networkName = CHAIN_ID_TO_ETHERS_NETWORK_NAME_MAP[chainId];
    const chainIdInt = parseInt(chainId, 16);
    const ensAddress = ensNetworkMap[chainIdInt.toString()];
    const ethProvider = new Web3Provider(provider, {
      chainId: chainIdInt,
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
