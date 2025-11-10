import type {
  NetworkConfiguration,
  NetworkState,
} from '@metamask/network-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  isSolanaChainId,
  isBitcoinChainId,
  isNativeAddress,
  formatChainIdToCaip,
  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE,
  getNativeAssetForChainId,
  type BridgeAppState as BridgeAppStateFromController,
  selectBridgeQuotes,
  selectIsQuoteExpired,
  selectBridgeFeatureFlags,
  selectMinimumBalanceForRentExemptionInSOL,
  isValidQuoteRequest,
  isCrossChain,
} from '@metamask/bridge-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { SolAccountType, BtcAccountType } from '@metamask/keyring-api';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import { uniqBy } from 'lodash';
import { createSelector } from 'reselect';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '@metamask/notification-services-controller/push-services';
import {
  parseCaipAssetType,
  parseCaipChainId,
  type CaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import type {
  CurrencyRateState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  MultichainBalancesControllerState,
  RatesControllerState,
  TokenListState,
  TokenRatesControllerState,
} from '@metamask/assets-controllers';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import type { MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import {
  type AccountGroupObject,
  type AccountTreeControllerState,
} from '@metamask/account-tree-controller';
import {
  MultichainNetworks,
  MULTICHAIN_PROVIDER_CONFIGS,
} from '../../../shared/constants/multichain/networks';
import {
  getHardwareWalletType,
  getUSDConversionRateByChainId,
  selectConversionRateByChainId,
} from '../../selectors/selectors';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getNetworkConfigurationsByChainId } from '../../../shared/modules/selectors/networks';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import {
  getMultichainBalances,
  getMultichainCoinRates,
} from '../../selectors/multichain';
import { getAssetsRates } from '../../selectors/assets';
import {
  HardwareKeyringNames,
  HardwareKeyringType,
} from '../../../shared/constants/hardware-wallets';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { Numeric } from '../../../shared/modules/Numeric';
import { getIsSmartTransaction } from '../../../shared/modules/selectors';
import {
  getInternalAccountsByScope,
  getSelectedInternalAccount,
} from '../../selectors/accounts';
import { getRemoteFeatureFlags } from '../../selectors/remote-feature-flags';
import {
  getAllAccountGroups,
  getInternalAccountBySelectedAccountGroupAndCaip,
  getWalletsWithAccounts,
} from '../../selectors/multichain-accounts/account-tree';
import { getAllEnabledNetworksForAllNamespaces } from '../../selectors/multichain/networks';

import {
  exchangeRateFromMarketData,
  exchangeRatesFromNativeAndCurrencyRates,
  tokenPriceInNativeAsset,
  getDefaultToToken,
  toBridgeToken,
  isNonEvmChain,
} from './utils';
import type { BridgeState } from './types';

export type BridgeAppState = {
  metamask: BridgeAppStateFromController &
    GasFeeState &
    NetworkState &
    AccountsControllerState &
    AccountTreeControllerState &
    MultichainAssetsRatesControllerState &
    TokenRatesControllerState &
    RatesControllerState &
    MultichainBalancesControllerState &
    MultichainTransactionsControllerState &
    MultichainAssetsControllerState &
    MultichainNetworkControllerState &
    TokenListState &
    RemoteFeatureFlagControllerState &
    CurrencyRateState & {
      useExternalServices: boolean;
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

// checks if the user has any bitcoin accounts created
const hasBitcoinAccounts = (state: BridgeAppState) => {
  // Access accounts from the state
  const accounts = state.metamask.internalAccounts?.accounts || {};

  // Check if any account is a Bitcoin account
  return Object.values(accounts).some((account) => {
    const { P2wpkh } = BtcAccountType;
    return Boolean(account && account.type === P2wpkh);
  });
};

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });

    return {
      ...validatedFlags,
      // TODO remove validation skip
      // @ts-expect-error - chainRanking is not typed yet
      chainRanking: bridgeConfig?.chainRanking,
    };
  },
);

// only includes networks user has added, ranked by the feature flagged chainRanking
const getAllBridgeableNetworks = createDeepEqualSelector(
  [(state) => getNetworkConfigurationsByChainId(state)],
  (networkConfigurationsByHexChainId) => {
    return Object.fromEntries([
      ...ALLOWED_BRIDGE_CHAIN_IDS.map((chainId) => [
        formatChainIdToCaip(chainId),
        networkConfigurationsByHexChainId[
          chainId as keyof typeof networkConfigurationsByHexChainId
        ],
      ]),
      [
        MultichainNetworks.SOLANA,
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
      ],
      ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
      [
        MultichainNetworks.BITCOIN,
        {
          ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN],
          blockExplorerUrls: [],
          name: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN]
            .nickname,
          nativeCurrency:
            MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN].ticker,
          rpcEndpoints: [{ url: '', type: '', networkClientId: '' }],
          defaultRpcEndpointIndex: 0,
          chainId: MultichainNetworks.BITCOIN,
        } as unknown as NetworkConfiguration,
      ],
      ///: END:ONLY_INCLUDE_IF
    ]);
  },
);

export const getPriceImpactThresholds = createDeepEqualSelector(
  getBridgeFeatureFlags,
  (bridgeFeatureFlags) => bridgeFeatureFlags?.priceImpactThreshold,
);

const getChainRanking = (state: BridgeAppState) => {
  const chainRanking = (
    getBridgeFeatureFlags(state).chainRanking as {
      chainId: CaipChainId;
    }[]
  ).map((c) => c.chainId);
  return Array.from(new Set(chainRanking));
};

export const getFromChains = createDeepEqualSelector(
  [
    getAllBridgeableNetworks,
    (state: BridgeAppState) => hasSolanaAccounts(state),
    (state: BridgeAppState) => hasBitcoinAccounts(state),
    getChainRanking,
  ],
  (
    allBridgeableNetworks,
    hasSolanaAccount,
    hasBitcoinAccount,
    chainRanking,
  ) => {
    return chainRanking
      .map((chainId: CaipChainId) => {
        // build a list of enabled chains ranked by chainRanking
        const matchedChain =
          allBridgeableNetworks[formatChainIdToCaip(chainId)];
        if (!matchedChain) {
          return null;
        }
        // if no solana account, filter out solana
        if (!hasSolanaAccount && isSolanaChainId(matchedChain.chainId)) {
          return null;
        }
        // if no bitcoin account, filter out bitcoin
        if (!hasBitcoinAccount && isBitcoinChainId(matchedChain.chainId)) {
          return null;
        }
        return matchedChain;
      })
      .filter(Boolean) as NetworkConfiguration[];
  },
);
// TODO use all Bridgeable?
// Returns the latest enabled network that matches a supported bridge network
// Matches the network filter in the activity and asset lists
const getNetworkFilterOrTopChain = createSelector(
  [getAllEnabledNetworksForAllNamespaces, getFromChains],
  (enabledEvmNetworks, fromChains) => {
    // If there is no network filter, return first chain ranked by bridge feature flags
    if (enabledEvmNetworks.length > 1) {
      return fromChains[0];
    }
    // If there is no match for the filter (i.e testnets), return first chain ranked by bridge feature flags
    const lastEnabledChainId = enabledEvmNetworks.find((chainId) =>
      fromChains.some(({ chainId: fromChainId }) => fromChainId === chainId),
    );
    return (
      fromChains.find(
        ({ chainId: fromChainId }) => fromChainId === lastEnabledChainId,
      ) ?? fromChains[0]
    );
  },
);

export const getFromToken = createSelector(
  [
    (state) => getNetworkFilterOrTopChain(state).chainId,
    (state: BridgeAppState) => state.bridge.fromToken,
  ],
  (lastEnabledChainId, fromToken) =>
    fromToken ?? toBridgeToken(getNativeAssetForChainId(lastEnabledChainId)),
);

const getFromChainId = (state: BridgeAppState) => getFromToken(state).chainId;
// For compatibility with old code
export const getFromChain = (state: BridgeAppState) => ({
  chainId: getFromChainId(state),
});

export const getToChains = createDeepEqualSelector(
  [getAllBridgeableNetworks, getChainRanking],
  (allBridgeableNetworks, chainRanking) => {
    const allChains = {
      ...allBridgeableNetworks,
      ...Object.fromEntries(
        FEATURED_RPCS.map((rpc) => [formatChainIdToCaip(rpc.chainId), rpc]),
      ),
    };
    return chainRanking
      .map((chainId) => allChains[formatChainIdToCaip(chainId)])
      .filter(Boolean) as NetworkConfiguration[];
  },
);

export const getTopAssetsFromFeatureFlags = (
  state: BridgeAppState,
  chainId?: CaipChainId | Hex,
) => {
  if (!chainId) {
    return undefined;
  }
  const bridgeFeatureFlags = getBridgeFeatureFlags(state);
  return bridgeFeatureFlags?.chains[formatChainIdToCaip(chainId)]?.topAssets;
};

const getDefaultTokenPair = createDeepEqualSelector(
  [
    (state) => getFromChain(state)?.chainId,
    (state) => getBridgeFeatureFlags(state).bip44DefaultPairs,
  ],
  (fromChainId, bip44DefaultPairs): null | [CaipAssetType, CaipAssetType] => {
    const { namespace } = parseCaipChainId(formatChainIdToCaip(fromChainId));
    const defaultTokenPair = bip44DefaultPairs?.[namespace]?.standard;
    if (defaultTokenPair) {
      return Object.entries(defaultTokenPair).flat() as [
        CaipAssetType,
        CaipAssetType,
      ];
    }
    return null;
  },
);

const getBIP44DefaultToChainId = createSelector(
  [(state) => getDefaultTokenPair(state)?.[1]],
  (defaulToAssetId) => {
    if (!defaulToAssetId) {
      return null;
    }
    return parseCaipAssetType(defaulToAssetId)?.chainId;
  },
);

// If the user has selected a toToken, return it
// Otherwise, return the default token for the fromChain.
export const getToToken = createSelector(
  [
    getFromToken,
    (state: BridgeAppState) => state.bridge.toToken,
    getBIP44DefaultToChainId,
  ],
  (fromToken, toToken, defaultToChainId) => {
    // If the user has selected a token, return it
    if (toToken) {
      return toToken;
    }
    // Bitcoin only has 1 asset, so we can use the default asset from LD
    if (isBitcoinChainId(fromToken.chainId) && defaultToChainId) {
      return toBridgeToken(getNativeAssetForChainId(defaultToChainId));
    }
    // Otherwise, determine the default token to use based on fromToken and toChain
    return toBridgeToken(getDefaultToToken(fromToken));
  },
);

const getToChainId = (state: BridgeAppState) => getToToken(state).chainId;
export const getToChain = (state: BridgeAppState) => ({
  chainId: getToChainId(state),
});

export const getFromAmount = (state: BridgeAppState): string | null =>
  state.bridge.fromTokenInputValue;

export const getAccountGroupNameByInternalAccount = createSelector(
  [getAllAccountGroups, (_, account: InternalAccount | null) => account],
  (accountGroups: AccountGroupObject[], account) => {
    if (!account?.id) {
      return null;
    }
    return (
      accountGroups.find(({ accounts }) => accounts.includes(account.id))
        ?.metadata.name ?? account?.metadata?.name
    );
  },
);

export const getFromAccount = createSelector(
  [
    (state) => getFromChain(state)?.chainId,
    (state) => state,
    getSelectedInternalAccount,
  ],
  (fromChainId, state, selectedInternalAccount) => {
    if (fromChainId) {
      return (
        getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          formatChainIdToCaip(fromChainId),
        ) ?? selectedInternalAccount
      );
    }
    return null;
  },
);

export const getToAccounts = createSelector(
  [getToChainId, getWalletsWithAccounts, (state) => state],
  (toChainId, accountsByWallet, state) => {
    if (!toChainId) {
      return [];
    }
    const internalAccounts = getInternalAccountsByScope(
      state,
      formatChainIdToCaip(toChainId),
    );

    return internalAccounts.map((account) => ({
      ...account,
      isExternal: false,
      walletName:
        account.options.entropy?.type === 'mnemonic'
          ? accountsByWallet[`entropy:${account.options.entropy.id}`]?.metadata
              .name
          : accountsByWallet[`keyring:${account.metadata.keyring.type}`]
              ?.metadata.name,
      displayName:
        getAccountGroupNameByInternalAccount(state, account) ??
        account.metadata.name ??
        account.address,
    }));
  },
);

const _getFromNativeBalance = createSelector(
  [
    getFromChainId,
    (state: BridgeAppState) => state.bridge.fromNativeBalance,
    getMultichainBalances,
    (state) => getFromAccount(state)?.id,
  ],
  (fromChainId, fromNativeBalance, nonEvmBalancesByAccountId, id) => {
    if (!id) {
      return null;
    }

    const { decimals, assetId } = getNativeAssetForChainId(fromChainId);

    // Use the balance provided by the multichain balances controller for non-EVM chains
    if (isNonEvmChain(fromChainId)) {
      return nonEvmBalancesByAccountId?.[id]?.[assetId]?.amount ?? null;
    }

    return fromNativeBalance
      ? Numeric.from(fromNativeBalance, 10).shiftedBy(decimals).toString()
      : null;
  },
);

export const getFromTokenBalance = createSelector(
  [
    getFromToken,
    (state: BridgeAppState) => state.bridge.fromTokenBalance,
    getMultichainBalances,
    getFromAccount,
  ],
  (fromToken, fromTokenBalance, nonEvmBalancesByAccountId, fromAccount) => {
    if (!fromAccount) {
      return null;
    }
    const { id } = fromAccount;
    const { chainId, decimals, assetId } = fromToken;

    // Use the balance provided by the multichain balances controller for non-EVM chains
    if (isNonEvmChain(chainId)) {
      return (
        nonEvmBalancesByAccountId?.[id]?.[assetId]?.amount ??
        fromToken.balance ??
        null
      );
    }

    return fromTokenBalance
      ? Numeric.from(fromTokenBalance, 10).shiftedBy(decimals).toString()
      : null;
  },
);

export const getSlippage = (state: BridgeAppState) => state.bridge.slippage;

export const getQuoteRequest = (state: BridgeAppState) => {
  const { quoteRequest } = state.metamask;
  return quoteRequest;
};

export const getQuoteRefreshRate = createSelector(
  [getBridgeFeatureFlags, getFromChainId],
  (extensionConfig, fromChainId) =>
    extensionConfig.chains[formatChainIdToCaip(fromChainId)]?.refreshRate ??
    extensionConfig.refreshRate,
);
export const getBridgeSortOrder = (state: BridgeAppState) =>
  state.bridge.sortOrder;

export const getFromTokenConversionRate = createSelector(
  [
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    getAssetsRates, // non-evm conversion rates multichain equivalent of getMarketData
    getFromToken,
    getMultichainCoinRates, // RatesController rates for native assets
    (state: BridgeAppState) => state.metamask.currencyRates, // EVM only
    (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
  ],
  (
    marketData,
    conversionRates,
    fromToken,
    rates,
    currencyRates,
    fromTokenExchangeRate,
  ) => {
    const fromChainId = fromToken.chainId;
    const nativeAssetId = getNativeAssetForChainId(fromChainId)?.assetId;
    const tokenAssetId = toAssetId(
      fromToken.address,
      formatChainIdToCaip(fromChainId),
    );
    const nativeAssetSymbol = getNativeAssetForChainId(fromChainId)?.symbol;
    const nativeToCurrencyRate = isNonEvmChain(fromChainId)
      ? Number(
          rates?.[nativeAssetSymbol.toLowerCase()]?.conversionRate ??
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
            null,
        )
      : (currencyRates[nativeAssetSymbol]?.conversionRate ?? null);
    const nativeToUsdRate = isNonEvmChain(fromChainId)
      ? Number(
          rates?.[nativeAssetSymbol?.toLowerCase()]?.usdConversionRate ??
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
            null,
        )
      : (currencyRates[nativeAssetSymbol]?.usdConversionRate ?? null);

    if (isNativeAddress(fromToken.address)) {
      return {
        valueInCurrency: nativeToCurrencyRate,
        usd: nativeToUsdRate,
      };
    }
    if (isSolanaChainId(fromChainId) && nativeAssetId && tokenAssetId) {
      // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
      const tokenToNativeAssetRate = tokenPriceInNativeAsset(
        Number(
          conversionRates?.[tokenAssetId]?.rate ??
            fromTokenExchangeRate ??
            null,
        ),
        Number(
          conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
            rates?.sol?.conversionRate ??
            null,
        ),
      );
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        Number(nativeToCurrencyRate),
        Number(nativeToUsdRate),
      );
    }

    if (isBitcoinChainId(fromChainId) && nativeAssetId && tokenAssetId) {
      // For Bitcoin tokens, we use the conversion rates provided by the multichain rates controller
      const nativeAssetRate = Number(
        conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null,
      );
      const tokenToNativeAssetRate = tokenPriceInNativeAsset(
        Number(
          conversionRates?.[tokenAssetId]?.rate ??
            fromTokenExchangeRate ??
            null,
        ),
        nativeAssetRate,
      );
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        Number(nativeToCurrencyRate),
        Number(nativeToUsdRate),
      );
    }
    // For EVM tokens, we use the market data to get the exchange rate
    const tokenToNativeAssetRate =
      exchangeRateFromMarketData(fromChainId, fromToken.address, marketData) ??
      tokenPriceInNativeAsset(fromTokenExchangeRate, nativeToCurrencyRate);

    return exchangeRatesFromNativeAndCurrencyRates(
      tokenToNativeAssetRate,
      nativeToCurrencyRate,
      nativeToUsdRate,
    );
  },
);

// A dest network can be selected before it's imported
// The cached exchange rate won't be available so the rate from the bridge state is used
export const getToTokenConversionRate = createDeepEqualSelector(
  [
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    getAssetsRates, // non-evm conversion rates, multichain equivalent of getMarketData
    getToToken,
    (state) => ({
      state,
      toTokenExchangeRate: state.bridge.toTokenExchangeRate,
      toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
    }),
    getMultichainCoinRates, // multichain native rates
    getAllBridgeableNetworks,
  ],
  (
    marketData,
    conversionRates,
    toToken,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
    rates,
    enabledNetworMap,
  ) => {
    const { chainId } = toToken;
    const isToChainEnabled = enabledNetworMap[formatChainIdToCaip(chainId)];
    // When the toChain is not imported, the exchange rate to native asset is not available
    // The rate in the bridge state is used instead
    if (!isToChainEnabled && toTokenExchangeRate) {
      return {
        valueInCurrency: toTokenExchangeRate,
        usd: toTokenUsdExchangeRate,
      };
    }
    const { assetId: nativeAssetId, symbol } =
      getNativeAssetForChainId(chainId);
    const tokenAssetId = toAssetId(
      toToken.address,
      formatChainIdToCaip(chainId),
    );
    const nativeSymbol = symbol?.toLowerCase();

    if (isSolanaChainId(chainId) && nativeAssetId && tokenAssetId) {
      // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
      const tokenToNativeAssetRate = tokenPriceInNativeAsset(
        Number(conversionRates?.[tokenAssetId]?.rate ?? null),
        Number(conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null),
      );
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        rates?.[nativeSymbol]?.conversionRate ?? null,
        rates?.[nativeSymbol]?.usdConversionRate ?? null,
      );
    }

    if (isBitcoinChainId(chainId) && nativeAssetId && tokenAssetId) {
      // For Bitcoin tokens, we use the conversion rates provided by the multichain rates controller
      const nativeAssetRate = Number(
        conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null,
      );
      const tokenToNativeAssetRate = tokenPriceInNativeAsset(
        Number(conversionRates?.[tokenAssetId]?.rate ?? null),
        nativeAssetRate,
      );
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        rates?.[nativeSymbol]?.conversionRate ?? null,
        rates?.[nativeSymbol]?.usdConversionRate ?? null,
      );
    }

    const nativeToCurrencyRate = selectConversionRateByChainId(state, chainId);
    const nativeToUsdRate = getUSDConversionRateByChainId(chainId)(state);

    if (isNativeAddress(toToken.address)) {
      return {
        valueInCurrency: nativeToCurrencyRate,
        usd: nativeToUsdRate,
      };
    }

    const tokenToNativeAssetRate =
      exchangeRateFromMarketData(chainId, toToken.address, marketData) ??
      tokenPriceInNativeAsset(toTokenExchangeRate, nativeToCurrencyRate);
    return exchangeRatesFromNativeAndCurrencyRates(
      tokenToNativeAssetRate,
      nativeToCurrencyRate,
      nativeToUsdRate,
    );
  },
);

export const getIsQuoteExpired = (
  { metamask }: BridgeAppState,
  currentTimeInMs: number,
) => selectIsQuoteExpired(metamask, {}, currentTimeInMs);

export const getBridgeQuotes = createSelector(
  [
    ({ metamask }: BridgeAppState) => metamask,
    ({ bridge: { sortOrder } }: BridgeAppState) => sortOrder,
    ({ bridge: { selectedQuote } }: BridgeAppState) => selectedQuote,
  ],
  (controllerStates, sortOrder, selectedQuote) =>
    selectBridgeQuotes(controllerStates, {
      sortOrder,
      selectedQuote,
    }),
);

export const getIsSwap = createDeepEqualSelector(
  [getQuoteRequest],
  ({ srcChainId, destChainId }) =>
    Boolean(
      srcChainId &&
        destChainId &&
        formatChainIdToCaip(srcChainId) === formatChainIdToCaip(destChainId),
    ),
);

const _getValidatedSrcAmount = createSelector(
  [
    (state) => getFromToken(state).decimals,
    (state: BridgeAppState) => state.metamask.quoteRequest.srcTokenAmount,
  ],
  (decimals, srcTokenAmount) =>
    srcTokenAmount && decimals
      ? calcTokenAmount(srcTokenAmount, Number(decimals)).toString()
      : null,
);

export const getFromAmountInCurrency = createSelector(
  [getFromToken, _getValidatedSrcAmount, getFromTokenConversionRate],
  (
    fromToken,
    validatedSrcAmount,
    {
      valueInCurrency: fromTokenToCurrencyExchangeRate,
      usd: fromTokenToUsdExchangeRate,
    },
  ) => {
    const fromChainId = fromToken.chainId;
    if (fromToken.symbol && fromChainId && validatedSrcAmount) {
      if (fromTokenToCurrencyExchangeRate) {
        return {
          valueInCurrency: new BigNumber(validatedSrcAmount).mul(
            new BigNumber(fromTokenToCurrencyExchangeRate.toString() ?? 1),
          ),
          usd: new BigNumber(validatedSrcAmount).mul(
            new BigNumber(fromTokenToUsdExchangeRate?.toString() ?? 1),
          ),
        };
      }
    }
    return {
      valueInCurrency: new BigNumber(0),
      usd: new BigNumber(0),
    };
  },
);

export const getTxAlerts = (state: BridgeAppState) => state.bridge.txAlert;

export const getValidationErrors = createDeepEqualSelector(
  getBridgeQuotes,
  _getValidatedSrcAmount,
  getFromToken,
  getFromAmount,
  ({ metamask }: BridgeAppState) =>
    selectMinimumBalanceForRentExemptionInSOL(metamask),
  getQuoteRequest,
  getTxAlerts,
  _getFromNativeBalance,
  getFromTokenBalance,
  (
    { activeQuote, quotesLastFetchedMs, isLoading, quotesRefreshCount },
    validatedSrcAmount,
    fromToken,
    fromTokenInputValue,
    minimumBalanceForRentExemptionInSOL,
    quoteRequest,
    txAlert,
    nativeBalance,
    fromTokenBalance,
  ) => {
    const { gasIncluded, gasIncluded7702 } = activeQuote?.quote ?? {};
    const isGasless = gasIncluded7702 || gasIncluded;

    const srcChainId =
      quoteRequest.srcChainId ?? activeQuote?.quote?.srcChainId;
    const minimumBalanceToUse =
      srcChainId && isSolanaChainId(srcChainId)
        ? minimumBalanceForRentExemptionInSOL
        : '0';

    return {
      isTxAlertPresent: Boolean(txAlert),
      isNoQuotesAvailable: Boolean(
        !activeQuote &&
          isValidQuoteRequest(quoteRequest) &&
          quotesLastFetchedMs &&
          !isLoading &&
          quotesRefreshCount > 0,
      ),
      // Shown prior to fetching quotes
      isInsufficientGasBalance: Boolean(
        nativeBalance &&
          !activeQuote &&
          validatedSrcAmount &&
          fromToken &&
          !isGasless &&
          (isNativeAddress(fromToken.address)
            ? new BigNumber(nativeBalance)
                .sub(minimumBalanceToUse)
                .lte(validatedSrcAmount)
            : new BigNumber(nativeBalance).lte(0)),
      ),
      // Shown after fetching quotes
      isInsufficientGasForQuote: Boolean(
        nativeBalance &&
          activeQuote &&
          fromToken &&
          fromTokenInputValue &&
          !isGasless &&
          (isNativeAddress(fromToken.address)
            ? new BigNumber(nativeBalance)
                .sub(activeQuote.totalMaxNetworkFee.amount)
                .sub(activeQuote.sentAmount.amount)
                .sub(minimumBalanceToUse)
                .lte(0)
            : new BigNumber(nativeBalance).lte(
                activeQuote.totalMaxNetworkFee.amount,
              )),
      ),
      isInsufficientBalance:
        validatedSrcAmount &&
        fromTokenBalance &&
        !isNaN(Number(fromTokenBalance))
          ? new BigNumber(fromTokenBalance).lt(validatedSrcAmount)
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

export const needsBitcoinAccountForDestination = createDeepEqualSelector(
  getToChain,
  (state: BridgeAppState) => hasBitcoinAccounts(state),
  (toChain, hasBitcoinAccount) => {
    if (!toChain) {
      return false;
    }

    const isBitcoinDestination = isBitcoinChainId(toChain.chainId);

    return isBitcoinDestination && !hasBitcoinAccount;
  },
);

export const getIsToOrFromNonEvm = createSelector(
  [getFromChainId, getToChainId],
  (fromChainId, toChainId) => {
    if (!fromChainId || !toChainId) {
      return false;
    }

    // Parse the CAIP chain IDs to get their namespaces
    const fromCaipChainId = formatChainIdToCaip(fromChainId);
    const toCaipChainId = formatChainIdToCaip(toChainId);

    const { namespace: fromNamespace } = parseCaipChainId(fromCaipChainId);
    const { namespace: toNamespace } = parseCaipChainId(toCaipChainId);

    // Return true if chains are in different namespaces
    // This covers EVM <> non-EVM as well as non-EVM <> non-EVM (e.g., Solana <> Bitcoin)
    return fromNamespace !== toNamespace;
  },
);

export const getIsSolanaSwap = createSelector(
  [getFromChainId, getToChainId],
  (fromChainId, toChainId) => {
    if (!fromChainId || !toChainId) {
      return false;
    }

    const fromChainIsSolana = isSolanaChainId(fromChainId);
    const toChainIsSolana = isSolanaChainId(toChainId);

    // Return true if BOTH chains are Solana (Solana-to-Solana swap)
    return fromChainIsSolana && toChainIsSolana;
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

export const selectNoFeeAssets = createSelector(
  [
    getBridgeFeatureFlags,
    (_state: BridgeAppState, chainId?: string) => chainId,
  ],
  (bridgeFeatureFlags, chainId): string[] => {
    if (!chainId) {
      return [];
    }
    const caipChainId = formatChainIdToCaip(chainId);
    return (
      (
        bridgeFeatureFlags?.chains?.[caipChainId] as unknown as {
          noFeeAssets?: string[];
        }
      )?.noFeeAssets ?? []
    );
  },
);

const getIsGasIncludedSwapSupported = createSelector(
  [
    (state) => getFromChain(state)?.chainId,
    (state) => getToChain(state)?.chainId,
    (_, isSendBundleSupportedForChain: boolean) =>
      isSendBundleSupportedForChain,
  ],
  (fromChainId, toChainId, isSendBundleSupportedForChain) => {
    if (!fromChainId) {
      return false;
    }
    const isSwap = !isCrossChain(fromChainId, toChainId);
    return isSwap && isSendBundleSupportedForChain;
  },
);

export const getIsStxEnabled = createSelector(
  [(state) => getFromChain(state)?.chainId, (state) => state],
  (fromChainId, state) => getIsSmartTransaction(state, fromChainId),
);

export const getIsGasIncluded = createSelector(
  [getIsStxEnabled, getIsGasIncludedSwapSupported],
  (isStxEnabled, isGasIncludedSwapSupported) => {
    return isStxEnabled && isGasIncludedSwapSupported;
  },
);
