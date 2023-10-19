import punycode from 'punycode/punycode';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import Ens from './ens';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_X_ERROR_ADDRESS = '0x';

export default class EnsController {
  constructor({ ens, provider, onNetworkDidChange, getCurrentChainId } = {}) {
    const initState = {
      ensResolutionsByAddress: {},
    };

    this._ens = ens;
    if (!this._ens) {
      const chainId = getCurrentChainId();
      if (Ens.getChainEnsSupport(chainId)) {
        this._ens = new Ens({
          chainId,
          provider,
        });
      }
    }

    this.store = new ObservableStore(initState);

    this.resetState = () => {
      this.store.updateState(initState);
    };

    onNetworkDidChange(() => {
      this.store.putState(initState);
      const chainId = getCurrentChainId();
      if (Ens.getChainEnsSupport(chainId)) {
        this._ens = new Ens({
          chainId,
          provider,
        });
      } else {
        delete this._ens;
      }
    });
  }

  reverseResolveAddress(address) {
    return this._reverseResolveAddress(toChecksumHexAddress(address));
  }

  async _reverseResolveAddress(address) {
    if (!this._ens) {
      return undefined;
    }

    const state = this.store.getState();
    if (state.ensResolutionsByAddress[address]) {
      return state.ensResolutionsByAddress[address];
    }

    let domain;
    try {
      domain = await this._ens.reverse(address);
    } catch (error) {
      log.debug(error);
      return undefined;
    }

    let registeredAddress;
    try {
      registeredAddress = await this._ens.lookup(domain);
    } catch (error) {
      log.debug(error);
      return undefined;
    }

    if (
      registeredAddress === ZERO_ADDRESS ||
      registeredAddress === ZERO_X_ERROR_ADDRESS
    ) {
      return undefined;
    }

    if (toChecksumHexAddress(registeredAddress) !== address) {
      return undefined;
    }

    this._updateResolutionsByAddress(address, punycode.toASCII(domain));
    return domain;
  }

  _updateResolutionsByAddress(address, domain) {
    const oldState = this.store.getState();
    this.store.putState({
      ensResolutionsByAddress: {
        ...oldState.ensResolutionsByAddress,
        [address]: domain,
      },
    });
  }
}
