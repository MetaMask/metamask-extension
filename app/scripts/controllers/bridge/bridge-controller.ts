import { add0x, type Hex } from '@metamask/utils';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import { NetworkClientId } from '@metamask/network-controller';
import { StateMetadata } from '@metamask/base-controller';
import { Contract } from '@ethersproject/contracts';
import { abiERC20 } from '@metamask/metamask-eth-abis';
import { Web3Provider } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { TransactionParams } from '@metamask/transaction-controller';
import type { ChainId } from '@metamask/controller-utils';
import { HandlerType } from '@metamask/snaps-utils';
import type { SnapId } from '@metamask/snaps-sdk';
import {
  fetchBridgeFeatureFlags,
  fetchBridgeQuotes,
} from '../../../../shared/modules/bridge-utils/bridge.util';
import {
  decimalToHex,
  sumHexes,
} from '../../../../shared/modules/conversion.utils';
import {
  type L1GasFees,
  type QuoteResponse,
  type TxData,
  type BridgeControllerState,
  BridgeFeatureFlagsKey,
  RequestStatus,
  type GenericQuoteRequest,
  type SolanaFees,
} from '../../../../shared/types/bridge';
import { isValidQuoteRequest } from '../../../../shared/modules/bridge-utils/quote';
import { hasSufficientBalance } from '../../../../shared/modules/bridge-utils/balance';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { REFRESH_INTERVAL_MS } from '../../../../shared/constants/bridge';
import {
  formatAddressToString,
  formatChainIdToCaip,
  formatChainIdToHex,
} from '../../../../shared/modules/bridge-utils/caip-formatters';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  BRIDGE_CONTROLLER_NAME,
  DEFAULT_BRIDGE_STATE,
  METABRIDGE_CHAIN_TO_ADDRESS_MAP,
} from './constants';
import type { BridgeControllerMessenger } from './types';

const metadata: StateMetadata<BridgeControllerState> = {
  bridgeState: {
    persist: false,
    anonymous: false,
  },
};

const RESET_STATE_ABORT_MESSAGE = 'Reset controller state';

/** The input to start polling for the {@link BridgeController} */
type BridgePollingInput = {
  networkClientId: NetworkClientId;
  updatedQuoteRequest: GenericQuoteRequest;
};

export default class BridgeController extends StaticIntervalPollingController<BridgePollingInput>()<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerState,
  BridgeControllerMessenger
> {
  #abortController: AbortController | undefined;

  #quotesFirstFetched: number | undefined;

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
        bridgeState: { ...DEFAULT_BRIDGE_STATE },
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
    paramsToUpdate: Partial<GenericQuoteRequest>,
  ) => {
    this.stopAllPolling();
    this.#abortController?.abort('Quote request updated');

    const { bridgeState } = this.state;
    const updatedQuoteRequest = {
      ...DEFAULT_BRIDGE_STATE.quoteRequest,
      ...paramsToUpdate,
    };

    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        quoteRequest: updatedQuoteRequest,
        quotes: DEFAULT_BRIDGE_STATE.quotes,
        quotesLastFetched: DEFAULT_BRIDGE_STATE.quotesLastFetched,
        quotesLoadingStatus: DEFAULT_BRIDGE_STATE.quotesLoadingStatus,
        quoteFetchError: DEFAULT_BRIDGE_STATE.quoteFetchError,
        quotesRefreshCount: DEFAULT_BRIDGE_STATE.quotesRefreshCount,
        quotesInitialLoadTime: DEFAULT_BRIDGE_STATE.quotesInitialLoadTime,
      };
    });

    if (isValidQuoteRequest(updatedQuoteRequest)) {
      this.#quotesFirstFetched = Date.now();
      const srcChainIdString = updatedQuoteRequest.srcChainId.toString();

      // Query the balance of the source token if the source chain is an EVM chain
      let insufficientBal: boolean | undefined;
      if (srcChainIdString === MultichainNetworks.SOLANA) {
        insufficientBal = paramsToUpdate.insufficientBal;
      } else {
        insufficientBal =
          paramsToUpdate.insufficientBal ||
          !(await this.#hasSufficientBalance(updatedQuoteRequest));
      }

      // Set refresh rate based on the source chain before starting polling
      this.#setIntervalLength();
      this.startPolling({
        networkClientId: srcChainIdString,
        updatedQuoteRequest: {
          ...updatedQuoteRequest,
          insufficientBal,
        },
      });
    }
  };

  #hasSufficientBalance = async (quoteRequest: GenericQuoteRequest) => {
    const walletAddress = this.#getMultichainSelectedAccount()?.address;
    const srcChainIdInHex = formatChainIdToHex(quoteRequest.srcChainId);
    const provider = this.#getSelectedNetworkClient()?.provider;
    const srcTokenAddressWithoutPrefix = formatAddressToString(
      quoteRequest.srcTokenAddress,
    );

    return (
      provider &&
      walletAddress &&
      srcTokenAddressWithoutPrefix &&
      quoteRequest.srcTokenAmount &&
      srcChainIdInHex &&
      (await hasSufficientBalance(
        provider,
        walletAddress,
        srcTokenAddressWithoutPrefix,
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
        ...DEFAULT_BRIDGE_STATE,
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
    this.#setIntervalLength();
  };

  /**
   * Sets the interval length based on the source chain
   */
  #setIntervalLength = () => {
    const { bridgeState } = this.state;
    const { srcChainId } = bridgeState.quoteRequest;
    const refreshRateOverride = srcChainId
      ? bridgeState.bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG]
          .chains[formatChainIdToCaip(srcChainId)]?.refreshRate
      : undefined;
    const defaultRefreshRate =
      bridgeState.bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG]
        .refreshRate;
    this.setIntervalLength(refreshRateOverride ?? defaultRefreshRate);
  };

  #fetchBridgeQuotes = async ({
    networkClientId: _networkClientId,
    updatedQuoteRequest,
  }: BridgePollingInput) => {
    this.#abortController?.abort('New quote request');
    this.#abortController = new AbortController();
    const { bridgeState } = this.state;
    this.update((_state) => {
      _state.bridgeState = {
        ...bridgeState,
        quotesLoadingStatus: RequestStatus.LOADING,
        quoteRequest: updatedQuoteRequest,
        quoteFetchError: DEFAULT_BRIDGE_STATE.quoteFetchError,
      };
    });

    try {
      const quotes = await fetchBridgeQuotes(
        updatedQuoteRequest,
        this.#abortController.signal,
      );

      const quotesWithL1GasFees = await this.#appendL1GasFees(quotes);
      const quotesWithSolanaFees = await this.#appendSolanaFees(quotes);

      this.update((_state) => {
        _state.bridgeState = {
          ..._state.bridgeState,
          quotes: quotesWithL1GasFees ?? quotesWithSolanaFees ?? quotes,
          quotesLoadingStatus: RequestStatus.FETCHED,
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
        };
      });
      console.log('Failed to fetch bridge quotes', error);
    } finally {
      const { maxRefreshCount } =
        bridgeState.bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG];

      const updatedQuotesRefreshCount = bridgeState.quotesRefreshCount + 1;
      // Stop polling if the maximum number of refreshes has been reached
      if (
        updatedQuoteRequest.insufficientBal ||
        (!updatedQuoteRequest.insufficientBal &&
          updatedQuotesRefreshCount >= maxRefreshCount)
      ) {
        this.stopAllPolling();
      }

      // Update quote fetching stats
      const quotesLastFetched = Date.now();
      this.update((_state) => {
        _state.bridgeState = {
          ..._state.bridgeState,
          quotesInitialLoadTime:
            updatedQuotesRefreshCount === 1 && this.#quotesFirstFetched
              ? quotesLastFetched - this.#quotesFirstFetched
              : bridgeState.quotesInitialLoadTime,
          quotesLastFetched,
          quotesRefreshCount: updatedQuotesRefreshCount,
        };
      });
    }
  };

  #appendL1GasFees = async (
    quotes: QuoteResponse[],
  ): Promise<(QuoteResponse & L1GasFees)[] | undefined> => {
    // Return undefined if some of the quotes are not for optimism or base
    if (
      quotes.some(({ quote }) => {
        const chainId = formatChainIdToCaip(quote.srcChainId);
        return ![CHAIN_IDS.OPTIMISM, CHAIN_IDS.BASE]
          .map(formatChainIdToCaip)
          .includes(chainId);
      })
    ) {
      return undefined;
    }

    return await Promise.all(
      quotes.map(async (quoteResponse) => {
        const { quote, trade, approval } = quoteResponse;
        const chainId = add0x(decimalToHex(quote.srcChainId)) as ChainId;

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

        return quoteResponse;
      }),
    );
  };

  #appendSolanaFees = async (
    quotes: QuoteResponse[],
  ): Promise<(QuoteResponse & SolanaFees)[] | undefined> => {
    // Return undefined if some of the quotes are not for solana
    if (
      quotes.some(({ quote }) => {
        return (
          formatChainIdToCaip(quote.srcChainId) !== MultichainNetworks.SOLANA
        );
      })
    ) {
      return undefined;
    }

    return await Promise.all(
      quotes.map(async (quoteResponse) => {
        const { trade } = quoteResponse;
        const selectedAccount = this.#getMultichainSelectedAccount();

        if (selectedAccount?.metadata?.snap?.id && typeof trade === 'string') {
          const { value: fees } = (await this.messagingSystem.call(
            'SnapController:handleRequest',
            {
              snapId: selectedAccount.metadata.snap.id as SnapId,
              origin: 'metamask',
              handler: HandlerType.OnRpcRequest,
              request: {
                method: 'getFeeForTransaction',
                params: {
                  transaction: trade,
                  scope: selectedAccount.options.scope,
                },
              },
            },
          )) as { value: string };

          return {
            ...quoteResponse,
            solanaFeesInLamports: fees,
          };
        }
        return quoteResponse;
      }),
    );
  };

  #getMultichainSelectedAccount() {
    return this.messagingSystem.call(
      'AccountsController:getSelectedMultichainAccount',
    ); // ?? this.messagingSystem.call('AccountsController:getSelectedAccount')
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
    const { address: walletAddress } =
      this.#getMultichainSelectedAccount() ?? {};
    const allowance = await contract.allowance(
      walletAddress,
      METABRIDGE_CHAIN_TO_ADDRESS_MAP[chainId],
    );
    return BigNumber.from(allowance).toString();
  };
}
