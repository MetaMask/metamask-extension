import punycode from 'punycode/punycode';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import Ud from './ud';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_X_ERROR_ADDRESS = '0x';

export default class UdController {
  constructor({ uDomain, onNetworkDidChange} = {}) {
    const initState = {
      domainResolutionsByAddress: {},
    };

    this._uDomain = uDomain;
    if (!this._uDomain) {
        this._uDomain = new Ud({});
    }

    this.store = new ObservableStore(initState);
    onNetworkDidChange(() => {
      this.store.putState(initState);
      this._uDomain = new Ud({});
    });
  }

  reverseResolveDomain(address) {
    return this._reverseResolveDomain(toChecksumHexAddress(address));
  }

  async _reverseResolveDomain(address) {
    if (!this._uDomain) {
      return undefined;
    }

    const state = this.store.getState();
    if (state.domainResolutionsByAddress[address]) {
      return state.domainResolutionsByAddress[address];
    }

    let domain;
    try {
      domain = await this._uDomain.reverse(address);
    } catch (error) {
      log.debug(error);
      return undefined;
    }

    let registeredAddress;
    try {
      registeredAddress = await this._uDomain.resolve(domain, "ETH");
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
      domainsResolutionsByAddress: {
        ...oldState.domainsResolutionsByAddress,
        [address]: domain,
      },
    });
  }
}
