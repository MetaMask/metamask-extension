import { StateMetadata } from '@metamask/base-controller';
import { add0x, Hex, Json } from '@metamask/utils';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import { NetworkClientId } from '@metamask/network-controller';
import {
  fetchBridgeFeatureFlags,
  fetchBridgeQuotes,
  fetchBridgeTokens,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/pages/bridge/bridge.util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { fetchTopAssetsList } from '../../../../ui/pages/swaps/swaps.util';
import {
  isValidQuoteRequest,
  QuoteRequest,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/pages/bridge/types';
import {
  decimalToHex,
  hexToDecimal,
} from '../../../../shared/modules/conversion.utils';
import { hasSufficientBalance } from '../../../../shared/modules/bridge-utils/balance';
import {
  BRIDGE_CONTROLLER_NAME,
  DEFAULT_BRIDGE_CONTROLLER_STATE,
  REFRESH_INTERVAL_MS,
  RequestStatus,
} from './constants';
import {
  BridgeControllerState,
  BridgeControllerMessenger,
  BridgeFeatureFlagsKey,
} from './types';

const metadata: StateMetadata<{ bridgeState: BridgeControllerState }> = {
  bridgeState: {
    persist: false,
    anonymous: false,
  },
};

export default class BridgeController extends StaticIntervalPollingController<
  typeof BRIDGE_CONTROLLER_NAME,
  { bridgeState: BridgeControllerState },
  BridgeControllerMessenger
> {
  #pollingTokenForQuotes: string | undefined;

  constructor({ messenger }: { messenger: BridgeControllerMessenger }) {
    super({
      name: BRIDGE_CONTROLLER_NAME,
      metadata,
      messenger,
      state: {
        bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE,
      },
    });

    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:setBridgeFeatureFlags`,
      this.setBridgeFeatureFlags.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:selectSrcNetwork`,
      this.selectSrcNetwork.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:selectDestNetwork`,
      this.selectDestNetwork.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:updateBridgeQuoteRequestParams`,
      this.updateBridgeQuoteRequestParams.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:resetState`,
      this.resetState.bind(this),
    );

    this.setIntervalLength(REFRESH_INTERVAL_MS);
    // TODO call resetState when tx is submitted (TransactionController)
  }

  _executePoll = async (
    networkClientId: NetworkClientId,
    updatedQuoteRequest: Json & QuoteRequest,
  ) => {
    if (
      Number(hexToDecimal(networkClientId)) === updatedQuoteRequest.srcChainId
    ) {
      await this.#fetchBridgeQuotes(updatedQuoteRequest);
    }
  };

  updateBridgeQuoteRequestParams = async (
    paramsToUpdate: Partial<QuoteRequest>,
  ) => {
    if (this.#pollingTokenForQuotes) {
      this.stopPollingByPollingToken(this.#pollingTokenForQuotes);
    }
    // TODO abort previous fetchBridgeQuotes request
    const { bridgeState } = this.state;
    const updatedQuoteRequest = {
      ...bridgeState.quoteRequest,
      ...paramsToUpdate,
    };

    const { quotes, quotesLastFetched, quotesLoadingStatus } =
      DEFAULT_BRIDGE_CONTROLLER_STATE;
    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        quoteRequest: {
          ...updatedQuoteRequest,
        },
        quotes,
        quotesLastFetched,
        quotesLoadingStatus,
      };
    });

    if (isValidQuoteRequest(updatedQuoteRequest)) {
      const { address: walletAddress } = this.#getSelectedAccount();
      const srcChainIdInHex = add0x(
        decimalToHex(updatedQuoteRequest.srcChainId),
      );
      const provider = this.#getSelectedNetworkClient()?.provider;

      const insufficientBal = provider
        ? !(await hasSufficientBalance(
            provider,
            walletAddress,
            updatedQuoteRequest.srcTokenAddress,
            updatedQuoteRequest.srcTokenAmount,
            srcChainIdInHex,
          ))
        : true;

      this.#pollingTokenForQuotes = this.startPollingByNetworkClientId(
        srcChainIdInHex,
        { ...updatedQuoteRequest, walletAddress, insufficientBal },
      );
    } else {
      this.stopAllPolling();
      this.update((_state) => {
        _state.bridgeState = {
          ..._state.bridgeState,
          quotes,
          quotesLastFetched,
          quotesLoadingStatus,
        };
      });
    }
  };

  resetState = () => {
    this.stopAllPolling();
    this.update((_state) => {
      _state.bridgeState = {
        ..._state.bridgeState,
        ...DEFAULT_BRIDGE_CONTROLLER_STATE,
        quotes: [],
        bridgeFeatureFlags: _state.bridgeState.bridgeFeatureFlags,
      };
    });
  };

  setBridgeFeatureFlags = async () => {
    const { bridgeState } = this.state;
    const bridgeFeatureFlags = await fetchBridgeFeatureFlags();
    this.update((_state) => {
      _state.bridgeState = { ...bridgeState, bridgeFeatureFlags };
    });
    this.setIntervalLength(
      bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG].refreshRate,
    );
  };

  selectSrcNetwork = async (chainId: Hex) => {
    this.updateBridgeQuoteRequestParams({
      srcChainId: Number(hexToDecimal(chainId)),
    });
    await this.#setTopAssets(chainId, 'srcTopAssets');
    await this.#setTokens(chainId, 'srcTokens');
  };

  selectDestNetwork = async (chainId: Hex) => {
    this.updateBridgeQuoteRequestParams({
      destChainId: Number(hexToDecimal(chainId)),
    });
    await this.#setTopAssets(chainId, 'destTopAssets');
    await this.#setTokens(chainId, 'destTokens');
  };

  switchToAndFromInputs = () => {
    const { bridgeState } = this.state;
    const { quotes, quotesLastFetched, quotesLoadingStatus, quoteRequest } =
      DEFAULT_BRIDGE_CONTROLLER_STATE;
    this.stopAllPolling();
    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        srcTopAssets: bridgeState.destTopAssets,
        destTopAssets: bridgeState.srcTopAssets,
        srcTokens: bridgeState.destTokens,
        destTokens: bridgeState.srcTokens,
        quotes,
        quotesLastFetched,
        quotesLoadingStatus,
        quoteRequest: {
          ...quoteRequest,
          srcChainId: bridgeState.quoteRequest.destChainId,
          destChainId: bridgeState.quoteRequest.srcChainId,
          srcTokenAddress: bridgeState.quoteRequest.destTokenAddress,
          destTokenAddress: bridgeState.quoteRequest.srcTokenAddress,
        },
      };
    });
  };

  #fetchBridgeQuotes = async (request: QuoteRequest) => {
    const { bridgeState } = this.state;
    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        quotesLastFetched: Date.now(),
        quotesLoadingStatus: RequestStatus.LOADING,
      };
    });

    try {
      // TODO abort controller integration
      const quotes = await fetchBridgeQuotes(request);
      this.update((_state) => {
        _state.bridgeState = {
          ...bridgeState,
          quotes,
          quotesLoadingStatus: RequestStatus.FETCHED,
        };
      });
    } catch (error) {
      console.error('Failed to fetch bridge quotes', error);
      this.update((_state) => {
        _state.bridgeState = {
          ...bridgeState,
          quotesLoadingStatus: RequestStatus.ERROR,
        };
      });
    }
  };

  #setTopAssets = async (
    chainId: Hex,
    stateKey: 'srcTopAssets' | 'destTopAssets',
  ) => {
    const { bridgeState } = this.state;
    const topAssets = await fetchTopAssetsList(chainId);
    this.update((_state) => {
      _state.bridgeState = { ...bridgeState, [stateKey]: topAssets };
    });
  };

  #setTokens = async (chainId: Hex, stateKey: 'srcTokens' | 'destTokens') => {
    const { bridgeState } = this.state;
    const tokens = await fetchBridgeTokens(chainId);
    this.update((_state) => {
      _state.bridgeState = { ...bridgeState, [stateKey]: tokens };
    });
  };

  #getSelectedAccount() {
    return this.messagingSystem.call('AccountsController:getSelectedAccount');
  }

  #getSelectedNetworkClient() {
    return this.messagingSystem.call(
      'NetworkController:getSelectedNetworkClient',
    );
  }

  // #getDestNetworkBalanceForToken = async (
  //   networkClientId: string,
  //   tokenAddress: string,
  // ) => {
  //   const { provider } = this.messagingSystem.call(
  //     'NetworkController:getNetworkClientById',
  //     [networkClientId],
  //   );

  //   return '0';
  // };
}
