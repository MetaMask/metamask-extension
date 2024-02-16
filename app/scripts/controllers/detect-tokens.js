import { warn } from 'loglevel';
import { StaticIntervalPollingControllerOnly } from '@metamask/polling-controller';
import { MINUTE } from '../../../shared/constants/time';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { isTokenDetectionEnabledForNetwork } from '../../../shared/modules/network.utils';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  AssetType,
  TokenStandard,
} from '../../../shared/constants/transaction';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = MINUTE * 3;

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
export default class DetectTokensController extends StaticIntervalPollingControllerOnly {
  /**
   * Creates a DetectTokensController
   *
   * @param {object} [config] - Options to configure controller
   * @param config.interval
   * @param config.preferences
   * @param config.network
   * @param config.tokenList
   * @param config.tokensController
   * @param config.assetsContractController
   * @param config.trackMetaMetricsEvent
   * @param config.messenger
   * @param config.getCurrentSelectedAccount
   * @param config.getNetworkClientById
   * @param config.disableLegacyInterval
   */
  constructor({
    messenger,
    interval = DEFAULT_INTERVAL,
    preferences,
    network,
    tokenList,
    tokensController,
    assetsContractController = null,
    trackMetaMetricsEvent,
    getCurrentSelectedAccount,
    getNetworkClientById,
    disableLegacyInterval = false,
  } = {}) {
    super();
    this.getNetworkClientById = getNetworkClientById;
    this.messenger = messenger;
    this.assetsContractController = assetsContractController;
    this.tokensController = tokensController;
    this.preferences = preferences;
    if (!disableLegacyInterval) {
      this.interval = interval;
    }
    this.network = network;
    this.tokenList = tokenList;
    this.useTokenDetection =
      this.preferences?.store.getState().useTokenDetection;
    this.selectedAddress = getCurrentSelectedAccount().address;
    this.setIntervalLength(interval);
    this.chainId = this.getChainIdFromNetworkStore();
    this._trackMetaMetricsEvent = trackMetaMetricsEvent;

    messenger.subscribe(
      'AccountsController:selectedAccountChange',
      (account) => {
        const useTokenDetection =
          this.preferences?.store.getState().useTokenDetection;
        if (
          this.selectedAddress !== account.address ||
          this.useTokenDetection !== useTokenDetection
        ) {
          this.selectedAddress = account.address;
          this.useTokenDetection = useTokenDetection;
          this.restartTokenDetection({
            selectedAddress: this.selectedAddress,
          });
        }
      },
    );

    preferences?.store.subscribe(({ useTokenDetection }) => {
      if (this.useTokenDetection !== useTokenDetection) {
        this.useTokenDetection = useTokenDetection;
        this.restartTokenDetection({
          selectedAddress: this.selectedAddress,
        });
      }
    });

    messenger.subscribe('NetworkController:stateChange', () => {
      if (this.chainId !== this.getChainIdFromNetworkStore()) {
        const chainId = this.getChainIdFromNetworkStore();
        this.chainId = chainId;
        this.restartTokenDetection({ chainId: this.chainId });
      }
    });

    messenger.subscribe('TokenListController:stateChange', () => {
      this.restartTokenDetection();
    });

    this.#registerKeyringHandlers();
  }

  async _executePoll(networkClientId, options) {
    await this.detectNewTokens({
      ...options,
      networkClientId,
    });
  }

  /**
   * For each token in the tokenlist provided by the TokenListController, check selectedAddress balance.
   *
   * @param options
   * @param options.selectedAddress - the selectedAddress against which to detect for token balances
   * @param options.chainId - the chainId against which to detect for token balances
   * @param options.networkClientId
   */
  async detectNewTokens({ selectedAddress, chainId, networkClientId } = {}) {
    const addressAgainstWhichToDetect = selectedAddress ?? this.selectedAddress;
    let chainIdAgainstWhichToDetect;
    let networkClientIdAgainstWhichToDetect;

    if (networkClientId) {
      networkClientIdAgainstWhichToDetect = networkClientId;
      const networkClient = this.getNetworkClientById(networkClientId);
      chainIdAgainstWhichToDetect = networkClient.configuration.chainId;
    } else {
      chainIdAgainstWhichToDetect =
        chainId ?? this.getChainIdFromNetworkStore();
      networkClientIdAgainstWhichToDetect =
        this.network.findNetworkClientIdByChainId(chainIdAgainstWhichToDetect);
    }

    if (!this.isActive) {
      return;
    }
    if (!isTokenDetectionEnabledForNetwork(chainIdAgainstWhichToDetect)) {
      return;
    }
    if (
      !this.useTokenDetection &&
      chainIdAgainstWhichToDetect !== CHAIN_IDS.MAINNET
    ) {
      return;
    }

    const isTokenDetectionInactiveInMainnet =
      !this.useTokenDetection &&
      chainIdAgainstWhichToDetect === CHAIN_IDS.MAINNET;
    const { tokenList } = this._tokenList.state;

    const tokenListUsed = isTokenDetectionInactiveInMainnet
      ? STATIC_MAINNET_TOKEN_LIST
      : tokenList;

    const tokensToDetect = [];
    for (const tokenAddress in tokenListUsed) {
      if (
        !this.tokensController.state.allTokens?.[chainIdAgainstWhichToDetect]?.[
          addressAgainstWhichToDetect
        ]?.find(({ address }) =>
          isEqualCaseInsensitive(address, tokenAddress),
        ) &&
        !this.tokensController.state.allIgnoredTokens?.[
          chainIdAgainstWhichToDetect
        ]?.[addressAgainstWhichToDetect]?.find((address) =>
          isEqualCaseInsensitive(address, tokenAddress),
        ) &&
        !this.tokensController.state.allDetectedTokens?.[
          chainIdAgainstWhichToDetect
        ]?.[addressAgainstWhichToDetect]?.find(({ address }) =>
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
          addressAgainstWhichToDetect,
          tokensSlice,
          networkClientIdAgainstWhichToDetect,
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
          const { address, symbol, decimals } =
            tokenListUsed[nonZeroTokenAddress];

          eventTokensDetails.push(`${symbol} - ${address}`);

          tokensWithBalance.push({
            address,
            symbol,
            decimals,
          });
        }

        if (tokensWithBalance.length > 0) {
          this._trackMetaMetricsEvent({
            event: MetaMetricsEventName.TokenDetected,
            category: MetaMetricsEventCategory.Wallet,
            properties: {
              tokens: eventTokensDetails,
              token_standard: TokenStandard.ERC20,
              asset_type: AssetType.token,
            },
          });
          await this.tokensController.addDetectedTokens(tokensWithBalance, {
            selectedAddress: addressAgainstWhichToDetect,
            chainId: chainIdAgainstWhichToDetect,
          });
        }
      }
    }
  }

  /**
   * Restart token detection polling period and call detectNewTokens
   * in case of address change or user session initialization.
   *
   * @param options
   * @param options.selectedAddress - the selectedAddress against which to detect for token balances
   * @param options.chainId - the chainId against which to detect for token balances
   */
  restartTokenDetection({ selectedAddress, chainId } = {}) {
    const addressAgainstWhichToDetect = selectedAddress ?? this.selectedAddress;
    const chainIdAgainstWhichToDetect =
      chainId ?? this.getChainIdFromNetworkStore();
    if (!(this.isActive && addressAgainstWhichToDetect)) {
      return;
    }
    this.detectNewTokens({
      selectedAddress: addressAgainstWhichToDetect,
      chainId: chainIdAgainstWhichToDetect,
    });
    this.interval = DEFAULT_INTERVAL;
  }

  getChainIdFromNetworkStore() {
    return this.network?.state.providerConfig.chainId;
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

  /**
   * Constructor helper to register listeners on the keyring
   * locked state changes
   */
  #registerKeyringHandlers() {
    const { isUnlocked } = this.messenger.call('KeyringController:getState');
    this.isUnlocked = isUnlocked;

    this.messenger.subscribe('KeyringController:unlock', () => {
      this.isUnlocked = true;
      this.restartTokenDetection();
    });

    this.messenger.subscribe('KeyringController:lock', () => {
      this.isUnlocked = false;
    });
  }
}
