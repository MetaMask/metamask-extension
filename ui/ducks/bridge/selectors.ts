import type { NetworkState } from '@metamask/network-controller';
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
import {
  SolAccountType,
  BtcAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';
import type { AccountsControllerState } from '@metamask/accounts-controller';
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
  AccountTrackerControllerState,
  CurrencyRateState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  MultichainBalancesControllerState,
  RatesControllerState,
  TokenBalancesControllerState,
  TokenListState,
  TokenRatesControllerState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { type MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import {
  type AccountGroupObject,
  type AccountTreeControllerState,
} from '@metamask/account-tree-controller';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import {
  getHardwareWalletType,
  getUSDConversionRateByChainId,
  selectConversionRateByChainId,
} from '../../selectors/selectors';
import {
  ALL_ALLOWED_BRIDGE_CHAIN_IDS,
  ALLOWED_EVM_BRIDGE_CHAIN_IDS,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
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
import type { BridgeState } from './types';
import {
  exchangeRateFromMarketData,
  exchangeRatesFromNativeAndCurrencyRates,
  tokenPriceInNativeAsset,
  getDefaultToToken,
  toBridgeToken,
  isNonEvmChain,
  isTronChainId,
} from './utils';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';

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
  if (isTronChainId(chainId)) {
    // Tron bridge only supports mainnet
    return isNativeAddress(address)
      ? MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.TRX
      : (assetId ?? address);
  }
  return assetId ?? address;
};

export type BridgeAppState = {
  metamask: BridgeAppStateFromController &
    GasFeeState &
    NetworkState &
    AccountsControllerState &
    AccountTreeControllerState &
    AccountTrackerControllerState &
    TokenBalancesControllerState &
    TokensControllerState &
    MultichainAccountsState['metamask'] &
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

// checks if the user has any tron accounts created
const hasTronAccounts = (state: BridgeAppState) => {
  // Access accounts from the state
  const accounts = state.metamask.internalAccounts?.accounts || {};

  // Check if any account is a Tron account
  return Object.values(accounts).some((account) => {
    const { Eoa } = TrxAccountType;
    return Boolean(account && account.type === Eoa);
  });
};

// only includes networks user has added
const getAllBridgeableNetworks = createDeepEqualSelector(
  [
    (state: BridgeAppState) =>
      state.metamask.multichainNetworkConfigurationsByChainId[
        MultichainNetworks.SOLANA
      ],
    (state: BridgeAppState) =>
      state.metamask.multichainNetworkConfigurationsByChainId[
        MultichainNetworks.BITCOIN
      ],
    (state: BridgeAppState) =>
      state.metamask.multichainNetworkConfigurationsByChainId[
        MultichainNetworks.TRON
      ],
    (state: BridgeAppState) => state.metamask.networkConfigurationsByChainId,
  ],
  (
    solanaMultichainNetworkConfiguration,
    bitcoinMultichainNetworkConfiguration,
    tronMultichainNetworkConfiguration,
    networkConfigurationsByHexChainId,
  ): Record<CaipChainId, { chainId: CaipChainId; name: string }> => {
    const allChains: Record<
      CaipChainId,
      { chainId: CaipChainId; name: string }
    > = {};

    ALLOWED_EVM_BRIDGE_CHAIN_IDS.forEach((chainId: Hex) => {
      if (networkConfigurationsByHexChainId[chainId]) {
        allChains[formatChainIdToCaip(chainId)] = {
          chainId: formatChainIdToCaip(chainId),
          name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[
            chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
          ],
        };
      }
    });
    if (solanaMultichainNetworkConfiguration) {
      allChains[MultichainNetworks.SOLANA] = {
        chainId: MultichainNetworks.SOLANA,
        name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[MultichainNetworks.SOLANA],
      };
    }
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
    if (bitcoinMultichainNetworkConfiguration) {
      allChains[MultichainNetworks.BITCOIN] = {
        chainId: MultichainNetworks.BITCOIN,
        name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[MultichainNetworks.BITCOIN],
      };
    }
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(tron)
    if (tronMultichainNetworkConfiguration) {
      allChains[MultichainNetworks.TRON] = {
        chainId: MultichainNetworks.TRON,
        name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[MultichainNetworks.TRON],
      };
    }
    ///: END:ONLY_INCLUDE_IF
    return allChains;
  },
);

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });

    return {
      ...validatedFlags,
      // @ts-expect-error - chainRanking is not typed yet. remove this after updating controller types
      chainRanking: bridgeConfig?.chainRanking,
    };
  },
);

export const getPriceImpactThresholds = createDeepEqualSelector(
  getBridgeFeatureFlags,
  (bridgeFeatureFlags) => bridgeFeatureFlags?.priceImpactThreshold,
);

const getChainRanking = (state: BridgeAppState) => {
  const chainRanking = (
    (getBridgeFeatureFlags(state)?.chainRanking as {
      chainId: CaipChainId;
    }[]) ?? []
  ).map((c) => c.chainId);
  // Remove duplicates
  return chainRanking.filter(
    (value, index, self) => self.indexOf(value) === index,
  );
};

export const getFromChains = createDeepEqualSelector(
  [
    getAllBridgeableNetworks,
    getChainRanking,
    (state: BridgeAppState) => hasSolanaAccounts(state),
    (state: BridgeAppState) => hasBitcoinAccounts(state),
    (state: BridgeAppState) => hasTronAccounts(state),
  ],
  (
    allBridgeableNetworks,
    chainRanking,
    hasSolanaAccount,
    hasBitcoinAccount,
    hasTronAccount,
  ): { chainId: CaipChainId; name: string }[] => {
    const fromChains: { chainId: CaipChainId; name: string }[] = [];
    chainRanking.forEach((chainId: CaipChainId) => {
      // build a list of enabled chains ranked by chainRanking
      const matchedChain = allBridgeableNetworks[chainId];
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
      // if no bitcoin account, filter out bitcoin
      if (!hasTronAccount && isTronChainId(matchedChain.chainId)) {
        return null;
      }
      return fromChains.push(matchedChain);
    });
    return fromChains;
  },
);

/**
 * This matches the network filter in the activity and asset lists
 */
export const getLastSelectedChain = createSelector(
  [getAllEnabledNetworksForAllNamespaces, getFromChains],
  (enabledEvmNetworks, fromChains) => {
    // If there is no network filter, return first chain ranked by bridge feature flags
    if (enabledEvmNetworks.length > 1) {
      return fromChains[0]; // TODO use bip44 default
    }
    // Find the matching bridge fromChain for the selected network filter
    return fromChains.find(
      ({ chainId: fromChainId }) =>
        fromChainId === formatChainIdToCaip(enabledEvmNetworks[0]),
    );
  },
);

export const getToChains = createDeepEqualSelector(
  [getAllBridgeableNetworks, getChainRanking],
  (allBridgeableNetworks, chainRanking) => {
    const allChains: Record<
      CaipChainId,
      { chainId: CaipChainId; name: string }
    > = {
      ...allBridgeableNetworks,
      ...Object.fromEntries(
        FEATURED_RPCS.map((rpc) => [
          formatChainIdToCaip(rpc.chainId),
          {
            chainId: formatChainIdToCaip(rpc.chainId),
            name: NETWORK_TO_SHORT_NETWORK_NAME_MAP[
              rpc.chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
            ],
          },
        ]),
      ),
    };

    const toChains: { chainId: CaipChainId; name: string }[] = [];
    chainRanking.forEach((chainId) => {
      const chain = allChains[chainId];
      if (chain) {
        toChains.push(chain);
      }
    });
    return toChains;
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

// TODO use BIP44 defaults instead of mainnet fallback
// Set to providerConfig by default
export const getFromToken = createDeepEqualSelector(
  [
    (state) =>
      ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(
        getMultichainProviderConfig(state).chainId,
      )
        ? getMultichainProviderConfig(state).chainId
        : 'eip155:1',
    (state: BridgeAppState) => state.bridge.fromToken,
  ],
  // TODO when GNS is removed, use the getLastSelectedChain instead of providerChainId
  (providerChainId, fromToken) => {
    return (
      fromToken ?? toBridgeToken(getNativeAssetForChainId(providerChainId))
    );
  },
);

const getFromChainId = (state: BridgeAppState) => getFromToken(state).chainId;
// For compatibility with old code
export const getFromChain = (
  state: BridgeAppState,
): { chainId: CaipChainId } => ({
  chainId: getFromChainId(state),
});

const getDefaultTokenPair = createDeepEqualSelector(
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
export const getToToken = createDeepEqualSelector(
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
  [getFromChainId, (state) => state, getSelectedInternalAccount],
  (fromChainId, state, selectedInternalAccount) => {
    return (
      getInternalAccountBySelectedAccountGroupAndCaip(
        state,
        formatChainIdToCaip(fromChainId),
      ) ?? selectedInternalAccount
    );
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
    const tokenAssetId = fromToken.assetId;
    const nativeAssetSymbol = getNativeAssetForChainId(fromChainId)?.symbol;
    const nativeToCurrencyRate = isNonEvmChain(fromToken.chainId)
      ? Number(
          rates?.[nativeAssetSymbol.toLowerCase()]?.conversionRate ??
            conversionRates?.[nativeAssetId as CaipAssetType]?.rate ??
            null,
        )
      : (currencyRates[nativeAssetSymbol]?.conversionRate ?? null);
    const nativeToUsdRate = isNonEvmChain(fromToken.chainId)
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
    // For non-EVM tokens (Solana, Bitcoin, Tron), we use the conversion rates provided by the multichain rates controller
    if (isNonEvmChain(fromChainId) && nativeAssetId && tokenAssetId) {
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

    if (isNativeAddress(fromToken.address)) {
      return {
        valueInCurrency: nativeToCurrencyRate,
        usd: nativeToUsdRate,
      };
    }

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
    getAllBridgeableNetworks,
    (state) => ({
      state,
      toTokenExchangeRate: state.bridge.toTokenExchangeRate,
      toTokenUsdExchangeRate: state.bridge.toTokenUsdExchangeRate,
    }),
    getMultichainCoinRates, // multichain native rates
  ],
  (
    marketData,
    conversionRates,
    toToken,
    allNetworksByChainId,
    { state, toTokenExchangeRate, toTokenUsdExchangeRate },
    rates,
  ) => {
    const { chainId } = toToken;
    const toChainId = toToken.chainId;
    const isToChainEnabled =
      allNetworksByChainId[formatChainIdToCaip(toChainId)];
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
    const tokenAssetId = toToken.assetId;
    const nativeSymbol = symbol;

    // For non-EVM tokens (Solana, Bitcoin, Tron), we use the conversion rates provided by the multichain rates controller
    if (isNonEvmChain(toChainId) && nativeAssetId && tokenAssetId) {
      const nativeAssetRate = Number(
        conversionRates?.[nativeAssetId as CaipAssetType]?.rate ?? null,
      );
      const tokenToNativeAssetRate = tokenPriceInNativeAsset(
        Number(conversionRates?.[tokenAssetId]?.rate ?? null),
        nativeAssetRate,
      );
      return exchangeRatesFromNativeAndCurrencyRates(
        tokenToNativeAssetRate,
        rates?.[nativeSymbol?.toLowerCase()]?.conversionRate ?? null,
        rates?.[nativeSymbol?.toLowerCase()]?.usdConversionRate ?? null,
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

export const needsTronAccountForDestination = createDeepEqualSelector(
  getToChain,
  (state: BridgeAppState) => hasTronAccounts(state),
  (toChain, hasTronAccount) => {
    if (!toChain) {
      return false;
    }

    const isTronDestination = isTronChainId(toChain.chainId);

    return isTronDestination && !hasTronAccount;
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
