import Web3 from 'web3';
import { warn } from 'loglevel';
import SINGLE_CALL_BALANCES_ABI from 'single-call-balance-checker-abi';
import { SINGLE_CALL_BALANCES_ADDRESS } from '../constants/contracts';
import { MINUTE } from '../../../shared/constants/time';
import { isEqualCaseInsensitive } from '../../../ui/helpers/utils/util';

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = MINUTE * 3;

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
export default class DetectTokensController {
  /**
   * Creates a DetectTokensController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor({
    interval = DEFAULT_INTERVAL,
    preferences,
    network,
    keyringMemStore,
    tokenList,
  } = {}) {
    this.preferences = preferences;
    this.interval = interval;
    this.network = network;
    this.keyringMemStore = keyringMemStore;
    this.tokenList = tokenList;
  }

  async _getTokenBalances(tokens) {
    const ethContract = this.web3.eth
      .contract(SINGLE_CALL_BALANCES_ABI)
      .at(SINGLE_CALL_BALANCES_ADDRESS);
    return new Promise((resolve, reject) => {
      ethContract.balances([this.selectedAddress], tokens, (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      });
    });
  }

  /**
   * For each token in the tokenlist provided by the TokenListController, check selectedAddress balance.
   */
  async detectNewTokens() {
    if (!this.isActive) {
      return;
    }

    const { tokenList } = this._tokenList.state;
    if (Object.keys(tokenList).length === 0) {
      return;
    }

    const tokensToDetect = [];
    this.web3.setProvider(this._network._provider);
    for (const tokenAddress in tokenList) {
      if (
        !this.tokenAddresses.find((address) =>
          isEqualCaseInsensitive(address, tokenAddress),
        ) &&
        !this.hiddenTokens.find((address) =>
          isEqualCaseInsensitive(address, tokenAddress),
        )
      ) {
        tokensToDetect.push(tokenAddress);
      }
    }
    const sliceOfTokensToDetect = [
      tokensToDetect.slice(0, 1000),
      tokensToDetect.slice(1000, tokensToDetect.length - 1),
    ];
    for (const tokensSlice of sliceOfTokensToDetect) {
      let result;
      try {
        result = await this._getTokenBalances(tokensSlice);
      } catch (error) {
        warn(
          `MetaMask - DetectTokensController single call balance fetch failed`,
          error,
        );
        return;
      }
      await Promise.all(
        tokensSlice.map(async (tokenAddress, index) => {
          const balance = result[index];
          if (balance && !balance.isZero()) {
            await this._preferences.addToken(
              tokenAddress,
              tokenList[tokenAddress].symbol,
              tokenList[tokenAddress].decimals,
            );
          }
        }),
      );
    }
  }

  /**
   * Restart token detection polling period and call detectNewTokens
   * in case of address change or user session initialization.
   *
   */
  restartTokenDetection() {
    if (!(this.isActive && this.selectedAddress)) {
      return;
    }
    this.detectNewTokens();
    this.interval = DEFAULT_INTERVAL;
  }

  /* eslint-disable accessor-pairs */
  /**
   * @type {Number}
   */
  set interval(interval) {
    this._handle && clearInterval(this._handle);
    if (!interval) {
      return;
    }
    this._handle = setInterval(() => {
      this.detectNewTokens();
    }, interval);
  }

  /**
   * In setter when selectedAddress is changed, detectNewTokens and restart polling
   * @type {Object}
   */
  set preferences(preferences) {
    if (!preferences) {
      return;
    }
    this._preferences = preferences;
    const currentTokens = preferences.store.getState().tokens;
    this.tokenAddresses = currentTokens
      ? currentTokens.map((token) => token.address)
      : [];
    this.hiddenTokens = preferences.store.getState().hiddenTokens;
    preferences.store.subscribe(({ tokens = [], hiddenTokens = [] }) => {
      this.tokenAddresses = tokens.map((token) => {
        return token.address;
      });
      this.hiddenTokens = hiddenTokens;
    });
    preferences.store.subscribe(({ selectedAddress, useTokenDetection }) => {
      if (
        this.selectedAddress !== selectedAddress ||
        this.useTokenDetection !== useTokenDetection
      ) {
        this.selectedAddress = selectedAddress;
        this.useTokenDetection = useTokenDetection;
        this.restartTokenDetection();
      }
    });
  }

  /**
   * @type {Object}
   */
  set network(network) {
    if (!network) {
      return;
    }
    this._network = network;
    this.web3 = new Web3(network._provider);
  }

  /**
   * In setter when isUnlocked is updated to true, detectNewTokens and restart polling
   * @type {Object}
   */
  set keyringMemStore(keyringMemStore) {
    if (!keyringMemStore) {
      return;
    }
    this._keyringMemStore = keyringMemStore;
    this._keyringMemStore.subscribe(({ isUnlocked }) => {
      if (this.isUnlocked !== isUnlocked) {
        this.isUnlocked = isUnlocked;
        if (isUnlocked) {
          this.restartTokenDetection();
        }
      }
    });
  }

  /**
   * @type {Object}
   */
  set tokenList(tokenList) {
    if (!tokenList) {
      return;
    }
    this._tokenList = tokenList;
  }

  /**
   * Internal isActive state
   * @type {Object}
   */
  get isActive() {
    return this.isOpen && this.isUnlocked;
  }
  /* eslint-enable accessor-pairs */
}
