import { ethers } from 'ethers';
import { warn } from 'loglevel';
import { MINUTE } from '../../../shared/constants/time';
import { MAINNET_CHAIN_ID } from '../../../shared/constants/network';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { isTokenDetectionEnabledForNetwork } from '../../../shared/modules/network.utils';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  ASSET_TYPES,
  TOKEN_STANDARDS,
} from '../../../shared/constants/transaction';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

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
   * @param {object} [config] - Options to configure controller
   * @param config.interval
   * @param config.preferences
   * @param config.network
   * @param config.keyringMemStore
   * @param config.tokenList
   * @param config.tokensController
   * @param config.assetsContractController
   * @param config.trackMetaMetricsEvent
   */
  constructor({
    interval = DEFAULT_INTERVAL,
    preferences,
    network,
    keyringMemStore,
    tokenList,
    tokensController,
    assetsContractController = null,
    trackMetaMetricsEvent,
  } = {}) {
    this.assetsContractController = assetsContractController;
    this.tokensController = tokensController;
    this.preferences = preferences;
    this.interval = interval;
    this.network = network;
    this.keyringMemStore = keyringMemStore;
    this.tokenList = tokenList;
    this.useTokenDetection =
      this.preferences?.store.getState().useTokenDetection;
    this.selectedAddress = this.preferences?.store.getState().selectedAddress;
    this.tokenAddresses = this.tokensController?.state.tokens.map((token) => {
      return token.address;
    });
    this.hiddenTokens = this.tokensController?.state.ignoredTokens;
    this.detectedTokens = this.tokensController?.state.detectedTokens;
    this.chainId = this.getChainIdFromNetworkStore(network);
    this._trackMetaMetricsEvent = trackMetaMetricsEvent;

    preferences?.store.subscribe(({ selectedAddress, useTokenDetection }) => {
      if (
        this.selectedAddress !== selectedAddress ||
        this.useTokenDetection !== useTokenDetection
      ) {
        this.selectedAddress = selectedAddress;
        this.useTokenDetection = useTokenDetection;
        this.restartTokenDetection();
      }
    });
    tokensController?.subscribe(
      ({ tokens = [], ignoredTokens = [], detectedTokens = [] }) => {
        this.tokenAddresses = tokens.map((token) => {
          return token.address;
        });
        this.hiddenTokens = ignoredTokens;
        this.detectedTokens = detectedTokens;
      },
    );
  }

  /**
   * For each token in the tokenlist provided by the TokenListController, check selectedAddress balance.
   */
  async detectNewTokens() {
    if (!this.isActive) {
      return;
    }
    if (
      !isTokenDetectionEnabledForNetwork(
        this.getChainIdFromNetworkStore(this._network),
      )
    ) {
      return;
    }
    if (
      !this.useTokenDetection &&
      this.getChainIdFromNetworkStore(this._network) !== MAINNET_CHAIN_ID
    ) {
      return;
    }

    const isTokenDetectionInactiveInMainnet =
      !this.useTokenDetection &&
      this.getChainIdFromNetworkStore(this._network) === MAINNET_CHAIN_ID;
    const { tokenList } = this._tokenList.state;

    const tokenListUsed = isTokenDetectionInactiveInMainnet
      ? STATIC_MAINNET_TOKEN_LIST
      : tokenList;

    const tokensToDetect = [];
    this.ethersProvider = new ethers.providers.Web3Provider(
      this._network._provider,
    );
    for (const tokenAddress in tokenListUsed) {
      if (
        !this.tokenAddresses.find(({ address }) =>
          isEqualCaseInsensitive(address, tokenAddress),
        ) &&
        !this.hiddenTokens.find((address) =>
          isEqualCaseInsensitive(address, tokenAddress),
        ) &&
        !this.detectedTokens.find(({ address }) =>
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
        result = await this.assetsContractController.getBalancesInSingleCall(
          this.selectedAddress,
          tokensSlice,
        );
      } catch (error) {
        warn(
          `MetaMask - DetectTokensController single call balance fetch failed`,
          error,
        );
        return;
      }

      const tokensWithBalance = [];
      const eventTokensDetails = [];
      if (result) {
        const nonZeroTokenAddresses = Object.keys(result);
        for (const nonZeroTokenAddress of nonZeroTokenAddresses) {
          const { address, symbol, decimals, aggregators } =
            tokenListUsed[nonZeroTokenAddress];

          eventTokensDetails.push(`${symbol} - ${address}`);

          tokensWithBalance.push({
            address,
            symbol,
            decimals,
            aggregators,
          });
        }

        if (tokensWithBalance.length > 0) {
          this._trackMetaMetricsEvent({
            event: EVENT_NAMES.TOKEN_DETECTED,
            category: EVENT.CATEGORIES.WALLET,
            properties: {
              tokens: eventTokensDetails,
              token_standard: TOKEN_STANDARDS.ERC20,
              asset_type: ASSET_TYPES.TOKEN,
            },
          });
          await this.tokensController.addDetectedTokens(tokensWithBalance);
        }
      }
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

  getChainIdFromNetworkStore(network) {
    return network?.store.getState().provider.chainId;
  }

  /* eslint-disable accessor-pairs */
  /**
   * @type {number}
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
   * @type {object}
   */
  set network(network) {
    if (!network) {
      return;
    }
    this._network = network;
    this.ethersProvider = new ethers.providers.Web3Provider(network._provider);
    this._network.store.subscribe(() => {
      if (this.chainId !== this.getChainIdFromNetworkStore(network)) {
        this.restartTokenDetection();
        this.chainId = this.getChainIdFromNetworkStore(network);
      }
    });
  }

  /**
   * In setter when isUnlocked is updated to true, detectNewTokens and restart polling
   *
   * @type {object}
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
   * @type {object}
   */
  set tokenList(tokenList) {
    if (!tokenList) {
      return;
    }
    this._tokenList = tokenList;
  }

  /**
   * Internal isActive state
   *
   * @type {object}
   */
  get isActive() {
    return this.isOpen && this.isUnlocked;
  }
  /* eslint-enable accessor-pairs */
}
