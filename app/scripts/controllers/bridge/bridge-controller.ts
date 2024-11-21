import { add0x, Hex } from '@metamask/utils';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import { NetworkClientId } from '@metamask/network-controller';
import { StateMetadata } from '@metamask/base-controller';
import { Contract } from '@ethersproject/contracts';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Web3Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { TransactionParams } from '@metamask/transaction-controller';
import type { ChainId } from '@metamask/controller-utils';
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
  decimalToHex,
  sumHexes,
} from '../../../../shared/modules/conversion.utils';
import {
  L1GasFees,
  QuoteRequest,
  QuoteResponse,
  TxData,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/pages/bridge/types';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isValidQuoteRequest } from '../../../../ui/pages/bridge/utils/quote';
import { hasSufficientBalance } from '../../../../shared/modules/bridge-utils/balance';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import {
  BRIDGE_CONTROLLER_NAME,
  DEFAULT_BRIDGE_CONTROLLER_STATE,
  REFRESH_INTERVAL_MS,
  RequestStatus,
  METABRIDGE_CHAIN_TO_ADDRESS_MAP,
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

const RESET_STATE_ABORT_MESSAGE = 'Reset controller state';

/** The input to start polling for the {@link BridgeController} */
type BridgePollingInput = {
  networkClientId: NetworkClientId;
  updatedQuoteRequest: QuoteRequest;
};

export default class BridgeController extends StaticIntervalPollingController<BridgePollingInput>()<
  typeof BRIDGE_CONTROLLER_NAME,
  { bridgeState: BridgeControllerState },
  BridgeControllerMessenger
> {
  #abortController: AbortController | undefined;

  #getLayer1GasFee: (params: {
    transactionParams: TransactionParams;
    chainId: ChainId;
  }) => Promise<string>;

  constructor({
    messenger,
    getLayer1GasFee,
  }: {
    messenger: BridgeControllerMessenger;
    getLayer1GasFee: (params: {
      transactionParams: TransactionParams;
      chainId: ChainId;
    }) => Promise<string>;
  }) {
    super({
      name: BRIDGE_CONTROLLER_NAME,
      metadata,
      messenger,
      state: {
        bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE,
      },
    });

    this.setIntervalLength(REFRESH_INTERVAL_MS);

    this.#abortController = new AbortController();
    // Register action handlers
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
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:getBridgeERC20Allowance`,
      this.getBridgeERC20Allowance.bind(this),
    );

    this.#getLayer1GasFee = getLayer1GasFee;
  }

  _executePoll = async (pollingInput: BridgePollingInput) => {
    await this.#fetchBridgeQuotes(pollingInput);
  };

  updateBridgeQuoteRequestParams = async (
    paramsToUpdate: Partial<QuoteRequest>,
  ) => {
    this.stopAllPolling();
    this.#abortController?.abort('Quote request updated');

    const { bridgeState } = this.state;
    const updatedQuoteRequest = {
      ...DEFAULT_BRIDGE_CONTROLLER_STATE.quoteRequest,
      ...paramsToUpdate,
    };

    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        quoteRequest: updatedQuoteRequest,
        quotes: DEFAULT_BRIDGE_CONTROLLER_STATE.quotes,
        quotesLastFetched: DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLastFetched,
        quotesLoadingStatus:
          DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLoadingStatus,
        quoteFetchError: DEFAULT_BRIDGE_CONTROLLER_STATE.quoteFetchError,
        quotesRefreshCount: DEFAULT_BRIDGE_CONTROLLER_STATE.quotesRefreshCount,
      };
    });

    if (isValidQuoteRequest(updatedQuoteRequest)) {
      const walletAddress = this.#getSelectedAccount().address;
      const srcChainIdInHex = add0x(
        decimalToHex(updatedQuoteRequest.srcChainId),
      );

      const insufficientBal =
        paramsToUpdate.insufficientBal ||
        !(await this.#hasSufficientBalance(updatedQuoteRequest));

      const networkClientId = this.#getSelectedNetworkClientId(srcChainIdInHex);
      this.startPolling({
        networkClientId,
        updatedQuoteRequest: {
          ...updatedQuoteRequest,
          walletAddress,
          insufficientBal,
        },
      });
    }
  };

  #hasSufficientBalance = async (quoteRequest: QuoteRequest) => {
    const walletAddress = this.#getSelectedAccount().address;
    const srcChainIdInHex = add0x(decimalToHex(quoteRequest.srcChainId));
    const provider = this.#getSelectedNetworkClient()?.provider;

    return (
      provider &&
      (await hasSufficientBalance(
        provider,
        walletAddress,
        quoteRequest.srcTokenAddress,
        quoteRequest.srcTokenAmount,
        srcChainIdInHex,
      ))
    );
  };

  resetState = () => {
    this.stopAllPolling();
    this.#abortController?.abort(RESET_STATE_ABORT_MESSAGE);

    this.update((_state) => {
      _state.bridgeState = {
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
    await this.#setTopAssets(chainId, 'srcTopAssets');
    await this.#setTokens(chainId, 'srcTokens');
  };

  selectDestNetwork = async (chainId: Hex) => {
    await this.#setTopAssets(chainId, 'destTopAssets');
    await this.#setTokens(chainId, 'destTokens');
  };

  #fetchBridgeQuotes = async ({
    networkClientId: _networkClientId,
    updatedQuoteRequest,
  }: BridgePollingInput) => {
    this.#abortController?.abort('New quote request');
    this.#abortController = new AbortController();
    if (updatedQuoteRequest.srcChainId === updatedQuoteRequest.destChainId) {
      return;
    }
    const { bridgeState } = this.state;
    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        quotesLoadingStatus: RequestStatus.LOADING,
        quoteRequest: updatedQuoteRequest,
        quoteFetchError: DEFAULT_BRIDGE_CONTROLLER_STATE.quoteFetchError,
      };
    });
    const { maxRefreshCount } =
      bridgeState.bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG];
    const newQuotesRefreshCount = bridgeState.quotesRefreshCount + 1;

    try {
      const quotes = await fetchBridgeQuotes(
        updatedQuoteRequest,
        this.#abortController.signal,
      );

      // Stop polling if the maximum number of refreshes has been reached
      if (
        (updatedQuoteRequest.insufficientBal && newQuotesRefreshCount >= 1) ||
        (!updatedQuoteRequest.insufficientBal &&
          newQuotesRefreshCount >= maxRefreshCount)
      ) {
        this.stopAllPolling();
      }

      const quotesWithL1GasFees = await this.#appendL1GasFees(quotes);

      this.update((_state) => {
        _state.bridgeState = {
          ..._state.bridgeState,
          quotes: quotesWithL1GasFees,
          quotesLastFetched: Date.now(),
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesRefreshCount: newQuotesRefreshCount,
        };
      });
    } catch (error) {
      const isAbortError = (error as Error).name === 'AbortError';
      const isAbortedDueToReset = error === RESET_STATE_ABORT_MESSAGE;
      if (isAbortedDueToReset || isAbortError) {
        return;
      }

      this.update((_state) => {
        _state.bridgeState = {
          ...bridgeState,
          quoteFetchError:
            error instanceof Error ? error.message : 'Unknown error',
          quotesLoadingStatus: RequestStatus.ERROR,
          quotesRefreshCount: newQuotesRefreshCount,
        };
      });
      console.log('Failed to fetch bridge quotes', error);
    }
  };

  #appendL1GasFees = async (
    quotes: QuoteResponse[],
  ): Promise<(QuoteResponse & L1GasFees)[]> => {
    return await Promise.all(
      quotes.map(async (quoteResponse) => {
        const { quote, trade, approval } = quoteResponse;
        const chainId = add0x(decimalToHex(quote.srcChainId)) as ChainId;
        if (
          [CHAIN_IDS.OPTIMISM.toString(), CHAIN_IDS.BASE.toString()].includes(
            chainId,
          )
        ) {
          const getTxParams = (txData: TxData) => ({
            from: txData.from,
            to: txData.to,
            value: txData.value,
            data: txData.data,
            gasLimit: txData.gasLimit?.toString(),
          });
          const approvalL1GasFees = approval
            ? await this.#getLayer1GasFee({
                transactionParams: getTxParams(approval),
                chainId,
              })
            : '0';
          const tradeL1GasFees = await this.#getLayer1GasFee({
            transactionParams: getTxParams(trade),
            chainId,
          });
          return {
            ...quoteResponse,
            l1GasFeesInHexWei: sumHexes(approvalL1GasFees, tradeL1GasFees),
          };
        }
        return quoteResponse;
      }),
    );
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

  #getSelectedNetworkClientId(chainId: Hex) {
    return this.messagingSystem.call(
      'NetworkController:findNetworkClientIdByChainId',
      chainId,
    );
  }

  /**
   *
   * @param contractAddress - The address of the ERC20 token contract
   * @param chainId - The hex chain ID of the bridge network
   * @returns The atomic allowance of the ERC20 token contract
   */
  getBridgeERC20Allowance = async (
    contractAddress: string,
    chainId: Hex,
  ): Promise<string> => {
    const provider = this.#getSelectedNetworkClient()?.provider;
    if (!provider) {
      throw new Error('No provider found');
    }

    const web3Provider = new Web3Provider(provider);
    const contract = new Contract(contractAddress, abiERC20, web3Provider);
    const { address: walletAddress } = this.#getSelectedAccount();
    const allowance = await contract.allowance(
      walletAddress,
      METABRIDGE_CHAIN_TO_ADDRESS_MAP[chainId],
    );
    return BigNumber.from(allowance).toString();
  };
}
