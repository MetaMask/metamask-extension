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
  getMultichainProviderConfig,
} from '../../selectors/multichain';
import { getAssetsRates } from '../../selectors/assets';
import {
  HardwareKeyringNames,
  HardwareKeyringType,
} from '../../../shared/constants/hardware-wallets';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from '../../../shared/constants/multichain/assets';
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

/**
 * Helper function to determine the CAIP asset type for non-EVM native assets
 *
 * @param chainId - The chain ID
 * @param address - The asset address
 * @param assetId - The asset ID
 * @returns The appropriate CAIP asset type string
 */
const getNonEvmNativeAssetType = (
  chainId: Hex | string | number | CaipChainId,
  address: string,
  assetId?: string,
): CaipAssetType | string => {
  if (isSolanaChainId(chainId)) {
    return isNativeAddress(address)
      ? MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.SOL
      : (assetId ?? address);
  }
  if (isBitcoinChainId(chainId)) {
    // Bitcoin bridge only supports mainnet
    return MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.BTC;
  }
  return assetId ?? address;
};

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

// only includes networks user has added
export const getAllBridgeableNetworks = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  (networkConfigurationsByChainId) => {
    return uniqBy(
      [
        ...Object.values(networkConfigurationsByChainId),
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
        ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
        // TODO: get this from network controller, use placeholder values for now
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

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });
    return validatedFlags;
  },
);

export const getPriceImpactThresholds = createDeepEqualSelector(
  getBridgeFeatureFlags,
  (bridgeFeatureFlags) => bridgeFeatureFlags?.priceImpactThreshold,
);

export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  getBridgeFeatureFlags,
  (state: BridgeAppState) => hasSolanaAccounts(state),
  (state: BridgeAppState) => hasBitcoinAccounts(state),
  (
    allBridgeableNetworks,
    bridgeFeatureFlags,
    hasSolanaAccount,
    hasBitcoinAccount,
  ) => {
    // First filter out Solana from source chains if no Solana account exists
    let filteredNetworks = hasSolanaAccount
      ? allBridgeableNetworks
      : allBridgeableNetworks.filter(
          ({ chainId }) => !isSolanaChainId(chainId),
        );

    // Then filter out Bitcoin from source chains if no Bitcoin account exists
    filteredNetworks = hasBitcoinAccount
      ? filteredNetworks
      : filteredNetworks.filter(({ chainId }) => !isBitcoinChainId(chainId));

    // Then apply the standard filter for active source chains
    return filteredNetworks.filter(
      ({ chainId }) =>
        bridgeFeatureFlags.chains[formatChainIdToCaip(chainId)]?.isActiveSrc,
    );
  },
);

/**
 * This matches the network filter in the activity and asset lists
 */
export const getLastSelectedChainId = createSelector(
  [getAllEnabledNetworksForAllNamespaces],
  (allEnabledNetworksForAllNamespaces) => {
    return allEnabledNetworksForAllNamespaces[0];
  },
);

// This returns undefined if the selected chain is not supported by swap/bridge (i.e, testnets)
export const getFromChain = createDeepEqualSelector(
  [getFromChains, getMultichainProviderConfig],
  (fromChains, providerConfig) => {
    // When the page loads the global network always matches the network filter
    // Because useBridging checks whether the lastSelectedNetwork matches the provider config
    // Then useBridgeQueryParams sets the global network to lastSelectedNetwork as needed
    // TODO remove providerConfig references and just use getLastSelectedChainId
    return fromChains.find(
      ({ chainId }) => chainId === providerConfig?.chainId,
    );
  },
);

export const getToChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  getBridgeFeatureFlags,
  getFromChain,
  (allBridgeableNetworks, bridgeFeatureFlags, fromChain) => {
    const availableChains = uniqBy(
      [...allBridgeableNetworks, ...FEATURED_RPCS],
      'chainId',
    ).filter(
      ({ chainId }) =>
        bridgeFeatureFlags?.chains?.[formatChainIdToCaip(chainId)]
          ?.isActiveDest,
    );

    // Prevent Bitcoin from being selected as destination when source is Bitcoin
    // (Bitcoin bridge only supports Bitcoin <-> EVM chains, not Bitcoin <-> Bitcoin)
    if (fromChain && isBitcoinChainId(fromChain.chainId)) {
      return availableChains.filter(
        ({ chainId }) => !isBitcoinChainId(chainId),
      );
    }

    // Similarly, prevent Solana from being selected as destination when source is Solana
    // if (fromChain && isSolanaChainId(fromChain.chainId)) {
    //   return availableChains.filter(({ chainId }) => !isSolanaChainId(chainId));
    // }

    return availableChains;
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

// If the user has selected a toChainId, return it as the destination chain
// Otherwise, use the source chain as the destination chain (default to swap params)
export const getToChain = createSelector(
  [
    getFromChain,
    getToChains,
    (state: BridgeAppState) => state.bridge?.toChainId,
  ],
  (fromChain, toChains, toChainId) =>
    toChainId
      ? toChains.find(
          ({ chainId }) =>
            chainId === toChainId || formatChainIdToCaip(chainId) === toChainId,
        )
      : fromChain,
);

export const getDefaultTokenPair = createDeepEqualSelector(
  [
    (state) => getFromChain(state)?.chainId,
    (state) => getBridgeFeatureFlags(state).bip44DefaultPairs,
  ],
  (fromChainId, bip44DefaultPairs): null | [CaipAssetType, CaipAssetType] => {
    if (!fromChainId) {
      return null;
    }
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

export const getFromToken = createSelector(
  [
    (state: BridgeAppState) => state.bridge.fromToken,
    (state) => getFromChain(state)?.chainId,
  ],
  (fromToken, fromChainId) => {
    if (!fromChainId) {
      return null;
    }
    if (fromToken?.address) {
      return fromToken;
    }
    const { iconUrl, ...nativeAsset } = getNativeAssetForChainId(fromChainId);
    const newToToken = toBridgeToken(nativeAsset);
    return newToToken
      ? {
          ...newToToken,
          chainId: formatChainIdToCaip(fromChainId),
        }
      : newToToken;
  },
);

export const getToToken = createSelector(
  [getFromToken, getToChain, (state) => state.bridge.toToken],
  (fromToken, toChain, toToken) => {
    if (!toChain || !fromToken) {
      return null;
    }
    // If the user has selected a token, return it
    if (toToken) {
      return toToken;
    }
    // Otherwise, determine the default token to use based on fromToken and toChain
    const defaultToken = getDefaultToToken(
      formatChainIdToCaip(toChain.chainId),
      fromToken,
    );
    return defaultToken ? toBridgeToken(defaultToken) : null;
  },
);

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
  [getToChain, getWalletsWithAccounts, (state) => state],
  (toChain, accountsByWallet, state) => {
    if (!toChain) {
      return [];
    }
    const internalAccounts = getInternalAccountsByScope(
      state,
      formatChainIdToCaip(toChain.chainId),
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
    getFromChain,
    (state: BridgeAppState) => state.bridge.fromNativeBalance,
    getMultichainBalances,
    (state) => getFromAccount(state)?.id,
  ],
  (fromChain, fromNativeBalance, nonEvmBalancesByAccountId, id) => {
    if (!fromChain || !id) {
      return null;
    }

    const { chainId } = fromChain;
    const { decimals, address, assetId } = getNativeAssetForChainId(chainId);

    // Use the balance provided by the multichain balances controller for non-EVM chains
    if (isNonEvmChain(chainId)) {
      const caipAssetType = getNonEvmNativeAssetType(chainId, address, assetId);
      return nonEvmBalancesByAccountId?.[id]?.[caipAssetType]?.amount ?? null;
    }

    return fromNativeBalance
      ? Numeric.from(fromNativeBalance, 10).shiftedBy(decimals).toString()
      : null;
  },
);

export const getFromTokenBalance = createSelector(
  getFromToken,
  getFromChain,
  (state: BridgeAppState) => state.bridge.fromTokenBalance,
  getMultichainBalances,
  getFromAccount,
  (
    fromToken,
    fromChain,
    fromTokenBalance,
    nonEvmBalancesByAccountId,
    fromAccount,
  ) => {
    if (!fromToken || !fromChain || !fromAccount) {
      return null;
    }
    const { id } = fromAccount;
    const { chainId, decimals, address, assetId } = fromToken;

    // Use the balance provided by the multichain balances controller for non-EVM chains
    if (isNonEvmChain(chainId)) {
      const caipAssetType = getNonEvmNativeAssetType(chainId, address, assetId);
      return (
        nonEvmBalancesByAccountId?.[id]?.[caipAssetType]?.amount ??
        fromToken.string ??
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
  getBridgeFeatureFlags,
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
  [
    getFromChain,
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    getAssetsRates, // non-evm conversion rates multichain equivalent of getMarketData
    getFromToken,
    getMultichainCoinRates, // RatesController rates for native assets
    (state: BridgeAppState) => state.metamask.currencyRates, // EVM only
    (state: BridgeAppState) => state.bridge.fromTokenExchangeRate,
  ],
  (
    fromChain,
    marketData,
    conversionRates,
    fromToken,
    rates,
    currencyRates,
    fromTokenExchangeRate,
  ) => {
    if (fromChain?.chainId && fromToken) {
      const nativeAssetId = getNativeAssetForChainId(
        fromChain.chainId,
      )?.assetId;
      const tokenAssetId = toAssetId(
        fromToken.address,
        formatChainIdToCaip(fromChain.chainId),
      );
      const nativeToCurrencyRate = isNonEvmChain(fromChain.chainId)
        ? Number(
            rates?.[fromChain.nativeCurrency?.toLowerCase()]?.conversionRate ??
              conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
              null,
          )
        : (currencyRates[fromChain.nativeCurrency]?.conversionRate ?? null);
      const nativeToUsdRate = isNonEvmChain(fromChain.chainId)
        ? Number(
            rates?.[fromChain.nativeCurrency?.toLowerCase()]
              ?.usdConversionRate ??
              conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
              null,
          )
        : (currencyRates[fromChain.nativeCurrency]?.usdConversionRate ?? null);

      if (isNativeAddress(fromToken.address)) {
        return {
          valueInCurrency: nativeToCurrencyRate,
          usd: nativeToUsdRate,
        };
      }
      if (isSolanaChainId(fromChain.chainId) && nativeAssetId && tokenAssetId) {
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

      if (
        isBitcoinChainId(fromChain.chainId) &&
        nativeAssetId &&
        tokenAssetId
      ) {
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
  [
    getToChain,
    (state: BridgeAppState) => state.metamask.marketData, // rates for non-native evm tokens
    getAssetsRates, // non-evm conversion rates, multichain equivalent of getMarketData
    getToToken,
    getNetworkConfigurationsByChainId,
    (state) => ({
      state,
      toTokenExchangeRate: state.bridge.toTokenExchangeRate,
      toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
    }),
    getMultichainCoinRates, // multichain native rates
  ],
  (
    toChain,
    marketData,
    conversionRates,
    toToken,
    allNetworksByChainId,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
    rates,
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
      const nativeAssetId = getNativeAssetForChainId(toChain.chainId)?.assetId;
      const tokenAssetId = toAssetId(
        toToken.address,
        formatChainIdToCaip(toChain.chainId),
      );

      if (isSolanaChainId(toChain.chainId) && nativeAssetId && tokenAssetId) {
        // For SOLANA tokens, we use the conversion rates provided by the multichain rates controller
        const tokenToNativeAssetRate = tokenPriceInNativeAsset(
          Number(conversionRates?.[tokenAssetId]?.rate ?? null),
          Number(
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null,
          ),
        );
        return exchangeRatesFromNativeAndCurrencyRates(
          tokenToNativeAssetRate,
          rates?.[toChain.nativeCurrency?.toLowerCase()]?.conversionRate ??
            null,
          rates?.[toChain.nativeCurrency?.toLowerCase()]?.usdConversionRate ??
            null,
        );
      }

      if (isBitcoinChainId(toChain.chainId) && nativeAssetId && tokenAssetId) {
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
          rates?.[toChain.nativeCurrency?.toLowerCase()]?.conversionRate ??
            null,
          rates?.[toChain.nativeCurrency?.toLowerCase()]?.usdConversionRate ??
            null,
        );
      }

      const { chainId } = toChain;

      const nativeToCurrencyRate = selectConversionRateByChainId(
        state,
        chainId,
      );
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
    }
    return exchangeRatesFromNativeAndCurrencyRates();
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

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (fromChain, toChain) =>
    toChain && fromChain?.chainId
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
  getFromChain,
  getToChain,
  (fromChain, toChain) => {
    if (!fromChain?.chainId || !toChain?.chainId) {
      return false;
    }

    // Parse the CAIP chain IDs to get their namespaces
    const fromCaipChainId = formatChainIdToCaip(fromChain.chainId);
    const toCaipChainId = formatChainIdToCaip(toChain.chainId);

    const { namespace: fromNamespace } = parseCaipChainId(fromCaipChainId);
    const { namespace: toNamespace } = parseCaipChainId(toCaipChainId);

    // Return true if chains are in different namespaces
    // This covers EVM <> non-EVM as well as non-EVM <> non-EVM (e.g., Solana <> Bitcoin)
    return fromNamespace !== toNamespace;
  },
);

export const getIsSolanaSwap = createSelector(
  getFromChain,
  getToChain,
  (fromChain, toChain) => {
    if (!fromChain?.chainId || !toChain?.chainId) {
      return false;
    }

    const fromChainIsSolana = isSolanaChainId(fromChain.chainId);
    const toChainIsSolana = isSolanaChainId(toChain.chainId);

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
