import type {
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  NetworkConfiguration,
  ///: END:ONLY_INCLUDE_IF
  NetworkState,
} from '@metamask/network-controller';
import { mergeGasFeeEstimates } from '@metamask/transaction-controller';
import { TokenDetectionState } from '@metamask/assets-controllers';
import {
  isSolanaChainId,
  type BridgeToken,
  BridgeFeatureFlagsKey,
  isNativeAddress,
  formatChainIdToCaip,
  BRIDGE_PREFERRED_GAS_ESTIMATE,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
  getNativeAssetForChainId,
  type BridgeAppState as BridgeAppStateFromController,
  selectBridgeQuotes,
  selectIsQuoteExpired,
} from '@metamask/bridge-controller';
import { SolAccountType } from '@metamask/keyring-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import type {
  GasFeeEstimates,
  GasFeeState,
} from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '@metamask/notification-services-controller/push-services';
import { CaipChainId, Hex } from '@metamask/utils';
import {
  MultichainNetworks,
  ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
  MULTICHAIN_PROVIDER_CONFIGS,
  ///: END:ONLY_INCLUDE_IF
} from '../../../shared/constants/multichain/networks';
import {
  getHardwareWalletType,
  getIsBridgeEnabled,
  getMarketData,
  getUSDConversionRate,
  getUSDConversionRateByChainId,
  selectConversionRateByChainId,
} from '../../selectors/selectors';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { getConversionRate } from '../metamask/metamask';
import {} from '../../pages/bridge/utils/quote';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import {
  getMultichainCoinRates,
  getMultichainProviderConfig,
  getImageForChainId,
} from '../../selectors/multichain';
import { getAssetsRates } from '../../selectors/assets';
import {
  HardwareKeyringNames,
  HardwareKeyringType,
} from '../../../shared/constants/hardware-wallets';
import {
  exchangeRateFromMarketData,
  exchangeRatesFromNativeAndCurrencyRates,
  tokenPriceInNativeAsset,
} from './utils';
import type { BridgeState } from './bridge';

export type BridgeAppState = {
  metamask: BridgeAppStateFromController &
    TokenDetectionState &
    GasFeeState &
    NetworkState &
    AccountsControllerState & {
      useExternalServices: boolean;
      currencyRates: {
        [currency: string]: {
          conversionRate: number;
          usdConversionRate?: number;
        };
      };
    };
  bridge: BridgeState;
};

// checks if the user has any solana accounts created
const hasSolanaAccounts = (state: BridgeAppState) => {
  // Access accounts from the state
  const accounts = state.metamask.internalAccounts?.accounts || {};

  // Check if any account is a Solana account
  return Object.values(accounts).some((account) => {
    const { DataAccount } = SolAccountType;
    return Boolean(account && account.type === DataAccount);
  });
};

// only includes networks user has added
export const getAllBridgeableNetworks = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  (networkConfigurationsByChainId) => {
    return uniqBy(
      [
        ...Object.values(networkConfigurationsByChainId),
        ///: BEGIN:ONLY_INCLUDE_IF(solana-swaps)
        // TODO: get this from network controller, use placeholder values for now
        {
          ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA],
          blockExplorerUrls: [],
          name: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].nickname,
          nativeCurrency:
            MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].ticker,
          rpcEndpoints: [{ url: '', type: '', networkClientId: '' }],
          defaultRpcEndpointIndex: 0,
          chainId: MultichainNetworks.SOLANA,
        } as unknown as NetworkConfiguration,
        ///: END:ONLY_INCLUDE_IF
      ],
      'chainId',
    ).filter(({ chainId }) =>
      ALLOWED_BRIDGE_CHAIN_IDS.includes(
        chainId as (typeof ALLOWED_BRIDGE_CHAIN_IDS)[number],
      ),
    );
  },
);

export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeFeatureFlags,
  (state: BridgeAppState) => hasSolanaAccounts(state),
  (allBridgeableNetworks, bridgeFeatureFlags, hasSolanaAccount) => {
    // First filter out Solana from source chains if no Solana account exists
    const filteredNetworks = hasSolanaAccount
      ? allBridgeableNetworks
      : allBridgeableNetworks.filter(
          ({ chainId }) => !isSolanaChainId(chainId),
        );

    // Then apply the standard filter for active source chains
    return filteredNetworks.filter(
      ({ chainId }) =>
        bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG].chains[
          formatChainIdToCaip(chainId)
        ]?.isActiveSrc,
    );
  },
);

export const getFromChain = createDeepEqualSelector(
  getMultichainProviderConfig,
  getFromChains,
  (providerConfig, fromChains) => {
    return providerConfig?.chainId
      ? fromChains.find(({ chainId }) => chainId === providerConfig.chainId)
      : undefined;
  },
);

export const getToChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeFeatureFlags,
  (allBridgeableNetworks, bridgeFeatureFlags) =>
    uniqBy([...allBridgeableNetworks, ...FEATURED_RPCS], 'chainId').filter(
      ({ chainId }) =>
        bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG]?.chains?.[
          formatChainIdToCaip(chainId)
        ]?.isActiveDest,
    ),
);

export const getTopAssetsFromFeatureFlags = (
  state: BridgeAppState,
  chainId?: CaipChainId | Hex,
) => {
  if (!chainId) {
    return undefined;
  }
  const { bridgeFeatureFlags } = state.metamask;
  return bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG].chains[
    formatChainIdToCaip(chainId)
  ]?.topAssets;
};

export const getToChain = createSelector(
  getToChains,
  (state: BridgeAppState) => state.bridge?.toChainId,
  (toChains, toChainId) =>
    toChainId
      ? toChains.find(
          ({ chainId }) =>
            chainId === toChainId || formatChainIdToCaip(chainId) === toChainId,
        )
      : undefined,
);

export const getFromToken = createSelector(
  (state: BridgeAppState) => state.bridge.fromToken,
  getFromChain,
  (fromToken, fromChain): BridgeToken | null => {
    if (!fromChain?.chainId) {
      return null;
    }
    if (fromToken?.address) {
      return fromToken;
    }
    const { iconUrl, ...nativeAsset } = getNativeAssetForChainId(
      fromChain.chainId,
    );
    return {
      ...nativeAsset,
      chainId: formatChainIdToCaip(fromChain.chainId),
      image:
        CHAIN_ID_TOKEN_IMAGE_MAP[
          fromChain.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
        ] ?? getImageForChainId(fromChain.chainId),
      balance: '0',
      string: '0',
    };
  },
);

export const getToToken = (state: BridgeAppState): BridgeToken | null => {
  return state.bridge.toToken;
};

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getSlippage = (state: BridgeAppState) => state.bridge.slippage;

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask;
  return quoteRequest;
};

export const getBridgeQuotesConfig = (state: BridgeAppState) =>
  state.metamask.bridgeFeatureFlags[BridgeFeatureFlagsKey.EXTENSION_CONFIG] ??
  {};

export const getQuoteRefreshRate = createSelector(
  getBridgeQuotesConfig,
  getFromChain,
  (extensionConfig, fromChain) =>
    (fromChain &&
      extensionConfig.chains[formatChainIdToCaip(fromChain.chainId)]
        ?.refreshRate) ??
    extensionConfig.refreshRate,
);
export const getBridgeSortOrder = (state: BridgeAppState) =>
  state.bridge.sortOrder;

export const getFromTokenConversionRate = createSelector(
  getFromChain,
  getMarketData,
  getAssetsRates,
  getFromToken,
  getUSDConversionRate,
  getMultichainCoinRates,
  getConversionRate,
  (state) => state.bridge.fromTokenExchangeRate,
  (
    fromChain,
    marketData,
    assetsRates,
    fromToken,
    nativeToUsdRate,
    nonEvmNativeConversionRate,
    nativeToCurrencyRate,
    fromTokenExchangeRate,
  ) => {
    if (fromChain?.chainId && fromToken) {
      if (isSolanaChainId(fromChain.chainId)) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          assetsRates[fromToken.assetId]?.rate,
          nonEvmNativeConversionRate?.sol?.conversionRate,
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          nonEvmNativeConversionRate?.sol?.conversionRate,
          nonEvmNativeConversionRate?.sol?.usdConversionRate,
        );
      }
      // For EVM tokens, we use the market data to get the exchange rate
      const tokenToNativeAssetRate =
        exchangeRateFromMarketData(
          fromChain.chainId,
          fromToken.address,
          marketData,
        ) ??
        tokenPriceInNativeAsset(fromTokenExchangeRate, nativeToCurrencyRate);
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        nativeToCurrencyRate,
        nativeToUsdRate,
      );
    }
    return exchangeRatesFromNativeAndCurrencyRates();
  },
);

// A dest network can be selected before it's imported
// The cached exchange rate won't be available so the rate from the bridge state is used
export const getToTokenConversionRate = createDeepEqualSelector(
  getToChain,
  getMarketData,
  getAssetsRates, // multichain equivalent of getMarketData
  getToToken,
  getNetworkConfigurationsByChainId,
  (state) => ({
    state,
    toTokenExchangeRate: state.bridge.toTokenExchangeRate,
    toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
  }),
  getMultichainCoinRates, // multichain native rates
  (
    toChain,
    marketData,
    assetsRates,
    toToken,
    allNetworksByChainId,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
    nonEvmNativeConversionRate,
  ) => {
    // When the toChain is not imported, the exchange rate to native asset is not available
    // The rate in the bridge state is used instead
    if (
      toChain?.chainId &&
      !allNetworksByChainId[toChain.chainId] &&
      toTokenExchangeRate
    ) {
      return {
        valueInCurrency: toTokenExchangeRate,
        usd: toTokenUsdExchangeRate,
      };
    }
    if (toChain?.chainId && toToken) {
      if (isSolanaChainId(toChain.chainId)) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          assetsRates[toToken.address]?.rate,
          nonEvmNativeConversionRate.sol.conversionRate,
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          nonEvmNativeConversionRate.sol.conversionRate,
          nonEvmNativeConversionRate.sol.usdConversionRate,
        );
      }

      const { chainId } = toChain;

      const nativeToCurrencyRate = selectConversionRateByChainId(
        state,
        chainId,
      );
      const nativeToUsdRate = getUSDConversionRateByChainId(chainId)(state);
      const tokenToNativeAssetRate =
        exchangeRateFromMarketData(chainId, toToken.address, marketData) ??
        tokenPriceInNativeAsset(toTokenExchangeRate, nativeToCurrencyRate);
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        nativeToCurrencyRate,
        nativeToUsdRate,
      );
    }
    return exchangeRatesFromNativeAndCurrencyRates();
  },
);

/* This is a duplicate of the {@link getGasFeeEstimates} selector in metamask/metamask.js */
const _getGasFeeEstimates = createSelector(
  [
    (state: BridgeAppState) => state.metamask.gasFeeEstimates,
    (state) => state.confirmTransaction?.txData?.gasFeeEstimates,
  ],
  (gasFeeControllerEstimates, transactionGasFeeEstimates): GasFeeEstimates => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimates: gasFeeControllerEstimates as GasFeeEstimates,
        transactionGasFeeEstimates,
      }) as GasFeeEstimates;
    }

    return gasFeeControllerEstimates as unknown as GasFeeEstimates;
  },
);

const _getBridgeFeesPerGas = createSelector(
  [_getGasFeeEstimates],
  (gasFeeEstimates) => ({
    estimatedBaseFeeInDecGwei: gasFeeEstimates?.estimatedBaseFee,
    maxPriorityFeePerGasInDecGwei: (gasFeeEstimates as GasFeeEstimates)?.[
      BRIDGE_PREFERRED_GAS_ESTIMATE
    ]?.suggestedMaxPriorityFeePerGas,
    maxFeePerGasInDecGwei: gasFeeEstimates?.high?.suggestedMaxFeePerGas,
    maxFeePerGas: decGWEIToHexWEI(gasFeeEstimates?.high?.suggestedMaxFeePerGas),
    maxPriorityFeePerGas: decGWEIToHexWEI(
      gasFeeEstimates?.high?.suggestedMaxPriorityFeePerGas,
    ),
  }),
);

export const getIsQuoteExpired = (
  { metamask }: BridgeAppState,
  currentTimeInMs: number,
) =>
  selectIsQuoteExpired(
    metamask,
    { featureFlagsKey: BridgeFeatureFlagsKey.EXTENSION_CONFIG },
    currentTimeInMs,
  );

export const getBridgeQuotes = createSelector(
  [
    ({ metamask }: BridgeAppState) => metamask,
    ({ bridge: { sortOrder } }: BridgeAppState) => sortOrder,
    ({ bridge: { selectedQuote } }: BridgeAppState) => selectedQuote,
    _getBridgeFeesPerGas,
  ],
  (controllerStates, sortOrder, selectedQuote, bridgeFeesPerGas) =>
    selectBridgeQuotes(controllerStates, {
      bridgeFeesPerGas,
      sortOrder,
      selectedQuote,
      featureFlagsKey: BridgeFeatureFlagsKey.EXTENSION_CONFIG,
    }),
);

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (state: BridgeAppState) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled && toChain && fromChain?.chainId
      ? fromChain.chainId !== toChain.chainId
      : false,
);

export const getIsSwap = createDeepEqualSelector(
  getQuoteRequest,
  ({ srcChainId, destChainId }) =>
    Boolean(
      srcChainId &&
        destChainId &&
        formatChainIdToCaip(srcChainId) === formatChainIdToCaip(destChainId),
    ),
);

const _getValidatedSrcAmount = createSelector(
  getFromToken,
  (state: BridgeAppState) => state.metamask.quoteRequest.srcTokenAmount,
  (fromToken, srcTokenAmount) =>
    srcTokenAmount && fromToken?.decimals
      ? calcTokenAmount(srcTokenAmount, Number(fromToken.decimals)).toString()
      : null,
);

export const getFromAmountInCurrency = createSelector(
  getFromToken,
  getFromChain,
  _getValidatedSrcAmount,
  getFromTokenConversionRate,
  (
    fromToken,
    fromChain,
    validatedSrcAmount,
    {
      valueInCurrency: fromTokenToCurrencyExchangeRate,
      usd: fromTokenToUsdExchangeRate,
    },
  ) => {
    if (fromToken?.symbol && fromChain?.chainId && validatedSrcAmount) {
      if (fromTokenToCurrencyExchangeRate && fromTokenToUsdExchangeRate) {
        return {
          valueInCurrency: new BigNumber(validatedSrcAmount)
            .mul(new BigNumber(fromTokenToCurrencyExchangeRate.toString() ?? 1))
            .toString(),
          usd: new BigNumber(validatedSrcAmount)
            .mul(new BigNumber(fromTokenToUsdExchangeRate.toString() ?? 1))
            .toString(),
        };
      }
    }
    return {
      valueInCurrency: '0',
      usd: '0',
    };
  },
);

export const getValidationErrors = createDeepEqualSelector(
  getBridgeQuotes,
  _getValidatedSrcAmount,
  getFromToken,
  getFromAmount,
  (
    { activeQuote, quotesLastFetchedMs, isLoading },
    validatedSrcAmount,
    fromToken,
    fromTokenInputValue,
  ) => {
    return {
      isNoQuotesAvailable: Boolean(
        !activeQuote && quotesLastFetchedMs && !isLoading,
      ),
      // Shown prior to fetching quotes
      isInsufficientGasBalance: (balance?: BigNumber) => {
        if (balance && !activeQuote && validatedSrcAmount && fromToken) {
          return isNativeAddress(fromToken.address)
            ? balance.eq(validatedSrcAmount)
            : balance.lte(0);
        }
        return false;
      },
      // Shown after fetching quotes
      isInsufficientGasForQuote: (balance?: BigNumber) => {
        if (balance && activeQuote && fromToken && fromTokenInputValue) {
          return isNativeAddress(fromToken.address)
            ? balance
                .sub(activeQuote.totalMaxNetworkFee.amount)
                .sub(activeQuote.sentAmount.amount)
                .lte(0)
            : balance.lte(activeQuote.totalMaxNetworkFee.amount);
        }
        return false;
      },
      isInsufficientBalance: (balance?: BigNumber) =>
        validatedSrcAmount && balance !== undefined
          ? balance.lt(validatedSrcAmount)
          : false,
      isEstimatedReturnLow:
        activeQuote?.sentAmount?.valueInCurrency &&
        activeQuote?.adjustedReturn?.valueInCurrency &&
        fromTokenInputValue
          ? new BigNumber(activeQuote.adjustedReturn.valueInCurrency).lt(
              new BigNumber(
                1 - BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
              ).times(activeQuote.sentAmount.valueInCurrency),
            )
          : false,
    };
  },
);

export const getWasTxDeclined = (state: BridgeAppState): boolean => {
  return state.bridge.wasTxDeclined;
};

/**
 * Checks if Solana is enabled as either a fromChain or toChain for bridging
 */
export const isBridgeSolanaEnabled = createDeepEqualSelector(
  (state: BridgeAppState) => state.metamask.bridgeFeatureFlags,
  (bridgeFeatureFlags) => {
    const solanaChainId = MultichainNetworks.SOLANA;
    const solanaChainIdCaip = formatChainIdToCaip(solanaChainId);

    // Directly check if Solana is enabled as a source or destination chain
    const solanaConfig =
      bridgeFeatureFlags?.[BridgeFeatureFlagsKey.EXTENSION_CONFIG]?.chains?.[
        solanaChainIdCaip
      ];
    return Boolean(solanaConfig?.isActiveSrc || solanaConfig?.isActiveDest);
  },
);

/**
 * Checks if the destination chain is Solana and the user has no Solana accounts
 */
export const needsSolanaAccountForDestination = createDeepEqualSelector(
  getToChain,
  (state: BridgeAppState) => hasSolanaAccounts(state),
  (toChain, hasSolanaAccount) => {
    if (!toChain) {
      return false;
    }

    const isSolanaDestination = isSolanaChainId(toChain.chainId);

    return isSolanaDestination && !hasSolanaAccount;
  },
);

export const getIsToOrFromSolana = createSelector(
  getFromChain,
  getToChain,
  (fromChain, toChain) => {
    if (!fromChain?.chainId || !toChain?.chainId) {
      return false;
    }

    const fromChainIsSolana = isSolanaChainId(fromChain.chainId);
    const toChainIsSolana = isSolanaChainId(toChain.chainId);

    // Only return true if either chain is Solana and the other is EVM
    return toChainIsSolana !== fromChainIsSolana;
  },
);

export const getHardwareWalletName = (state: BridgeAppState) => {
  const type = getHardwareWalletType(state);
  switch (type) {
    case HardwareKeyringType.ledger:
      return HardwareKeyringNames.ledger;
    case HardwareKeyringType.trezor:
      return HardwareKeyringNames.trezor;
    case HardwareKeyringType.lattice:
      return HardwareKeyringNames.lattice;
    case HardwareKeyringType.oneKey:
      return HardwareKeyringNames.oneKey;
    default:
      return undefined;
  }
};
