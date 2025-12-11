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
  type QuoteWarning,
} from '@metamask/bridge-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import {
  SolAccountType,
  BtcAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';
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
import { getHardwareWalletType } from '../../selectors/selectors';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import {
  getMultichainBalances,
  getMultichainCoinRates,
  getMultichainNetworkConfigurationsByChainId,
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
import {
  getIsSmartTransaction,
  type SmartTransactionsMetaMaskState,
} from '../../../shared/modules/selectors';
import { calcTokenValue } from '../../../shared/lib/swaps-utils';
import { safeAmountForCalc } from '../../pages/bridge/utils/quote';
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
  isTronChainId,
} from './utils';
import type { BridgeNetwork, BridgeState } from './types';

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
    SmartTransactionsMetaMaskState['metamask'] &
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

// Only includes networks user has added
const getAllBridgeableNetworks = createDeepEqualSelector(
  [getMultichainNetworkConfigurationsByChainId],
  (
    multichainNetworkConfigurationsByChainId,
  ): Record<CaipChainId, BridgeNetwork> => {
    // Build a record of networks keyed by ALL_ALLOWED_BRIDGE_CHAIN_IDS
    return ALLOWED_BRIDGE_CHAIN_IDS.reduce(
      (
        networkRecord: Record<Hex | CaipChainId, BridgeNetwork>,
        chainId: Hex | CaipChainId,
      ) => {
        if (multichainNetworkConfigurationsByChainId[chainId]) {
          networkRecord[formatChainIdToCaip(chainId)] =
            multichainNetworkConfigurationsByChainId[chainId];
        }
        return networkRecord;
      },
      {} as Record<CaipChainId, BridgeNetwork>,
    );
  },
);

const getBridgeFeatureFlags = createDeepEqualSelector(
  [(state: BridgeAppState) => getRemoteFeatureFlags(state).bridgeConfig],
  (bridgeConfig) => {
    const validatedFlags = selectBridgeFeatureFlags({
      remoteFeatureFlags: { bridgeConfig },
    });
    return validatedFlags;
  },
);

export const getPriceImpactThresholds = createDeepEqualSelector(
  [
    (state: BridgeAppState) =>
      getBridgeFeatureFlags(state).priceImpactThreshold,
  ],
  (priceImpactThreshold) => priceImpactThreshold,
);

export const getFromChains = createDeepEqualSelector(
  [
    getAllBridgeableNetworks,
    (state: BridgeAppState) => getBridgeFeatureFlags(state).chains,
    (state: BridgeAppState) => hasSolanaAccounts(state),
    (state: BridgeAppState) => hasBitcoinAccounts(state),
    (state: BridgeAppState) => hasTronAccounts(state),
  ],
  (
    allBridgeableNetworks,
    chainsConfig,
    hasSolanaAccount,
    hasBitcoinAccount,
    hasTronAccount,
  ) => {
    const filteredNetworks: BridgeNetwork[] = [];
    Object.entries(chainsConfig).forEach(([chainId, { isActiveSrc }]) => {
      if (!isActiveSrc) {
        return;
      }
      // Determine if non-evm chains should be added to the list
      const shouldAddSolana = isSolanaChainId(chainId)
        ? hasSolanaAccount
        : true;
      const shouldAddBitcoin = isBitcoinChainId(chainId)
        ? hasBitcoinAccount
        : true;
      const shouldAddTron = isTronChainId(chainId) ? hasTronAccount : true;
      const matchedNetwork =
        allBridgeableNetworks[formatChainIdToCaip(chainId)];
      // If all conditions are met, add the network to the list
      if (
        [
          shouldAddSolana,
          shouldAddBitcoin,
          shouldAddTron,
          matchedNetwork,
        ].every(Boolean)
      ) {
        filteredNetworks.push(matchedNetwork);
      }
    });
    return filteredNetworks;
  },
);

/**
 * This matches the network filter in the activity and asset lists
 */
export const getLastSelectedChainId = createSelector(
  [getAllEnabledNetworksForAllNamespaces, getFromChains],
  (allEnabledNetworksForAllNamespaces, fromChains) => {
    // If there is no network filter, return mainnet
    if (allEnabledNetworksForAllNamespaces.length > 1) {
      return CHAIN_IDS.MAINNET;
    }
    // Find the matching bridge fromChain for the selected network filter
    return fromChains.find(
      ({ chainId: fromChainId }) =>
        fromChainId === allEnabledNetworksForAllNamespaces[0],
    )?.chainId;
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
  [getAllBridgeableNetworks, getBridgeFeatureFlags],
  (allBridgeableNetworks, bridgeFeatureFlags) => {
    const availableChains = uniqBy(
      [...Object.values(allBridgeableNetworks), ...FEATURED_RPCS],
      'chainId',
    ).filter(
      ({ chainId }) =>
        bridgeFeatureFlags?.chains?.[formatChainIdToCaip(chainId)]
          ?.isActiveDest,
    );

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

const getDefaultTokenPair = createDeepEqualSelector(
  [
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (state: BridgeAppState) => getBridgeFeatureFlags(state).bip44DefaultPairs,
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
  [(state: BridgeAppState) => getDefaultTokenPair(state)?.[1]],
  (defaulToAssetId) => {
    if (!defaulToAssetId) {
      return null;
    }
    return parseCaipAssetType(defaulToAssetId)?.chainId;
  },
);

// If the user has selected a toChainId, return it as the destination chain
// Otherwise, use the source chain as the destination chain (default to swap params)
export const getToChain = createSelector(
  [
    getFromChain,
    getToChains,
    (state: BridgeAppState) => state.bridge?.toChainId,
    getBIP44DefaultToChainId,
  ],
  (fromChain, toChains, toChainId, defaultToChainId) => {
    // If user has explicitly selected a destination, use it
    if (toChainId) {
      return toChains.find(
        ({ chainId }) =>
          chainId === toChainId || formatChainIdToCaip(chainId) === toChainId,
      );
    }

    // Bitcoin can only bridge to EVM chains, not to Bitcoin
    // So if source is Bitcoin, default to BIP44 default chain
    if (fromChain && isBitcoinChainId(fromChain.chainId)) {
      return toChains.find(({ chainId }) => {
        return formatChainIdToCaip(chainId) === defaultToChainId;
      });
    }

    // For all other chains, default to same chain (swap mode)
    return fromChain;
  },
);

export const getFromToken = createSelector(
  [
    (state: BridgeAppState) => state.bridge.fromToken,
    (state: BridgeAppState) => getFromChain(state)?.chainId,
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
  [getFromToken, getToChain, (state: BridgeAppState) => state.bridge.toToken],
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
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (state: BridgeAppState) => state,
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
  [getToChain, getWalletsWithAccounts, (state: BridgeAppState) => state],
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
    (state: BridgeAppState) => getFromAccount(state)?.id,
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
  [
    getFromToken,
    getFromChain,
    (state: BridgeAppState) => state.bridge.fromTokenBalance,
    getMultichainBalances,
    getFromAccount,
  ],
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
  [getBridgeFeatureFlags, getFromChain],
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
      // For non-EVM tokens (Solana, Bitcoin, Tron), we use the conversion rates provided by the multichain rates controller
      if (isNonEvmChain(fromChain.chainId) && nativeAssetId && tokenAssetId) {
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

export const getValidatedFromValue = createSelector(
  [getFromToken, getFromAmount],
  (fromToken, unvalidatedInputValue) =>
    unvalidatedInputValue && fromToken?.decimals
      ? calcTokenValue(
          safeAmountForCalc(unvalidatedInputValue),
          fromToken.decimals,
        )
          .toFixed()
          // Length of decimal part cannot exceed token.decimals
          .split('.')[0]
      : undefined,
);

const _getValidatedSrcAmount = createSelector(
  [getFromToken, getValidatedFromValue],
  (fromToken, srcTokenAmount) =>
    srcTokenAmount && fromToken?.decimals
      ? calcTokenAmount(srcTokenAmount, Number(fromToken.decimals)).toString()
      : undefined,
);

export const getFromAmountInCurrency = createSelector(
  [
    getFromToken,
    getFromChain,
    _getValidatedSrcAmount,
    getFromTokenConversionRate,
  ],
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
  [
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
  ],
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
    const { gasIncluded, gasIncluded7702, gasSponsored } =
      activeQuote?.quote ?? {};
    const isGasless = gasIncluded7702 || gasIncluded || gasSponsored;

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
                .sub(activeQuote.totalNetworkFee.amount)
                .sub(activeQuote.sentAmount.amount)
                .sub(minimumBalanceToUse)
                .lte(0)
            : new BigNumber(nativeBalance).lte(
                activeQuote.totalNetworkFee.amount,
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

export const getWarningLabels = createSelector(
  [getValidationErrors],
  ({
    isEstimatedReturnLow,
    isNoQuotesAvailable,
    isInsufficientGasBalance,
    isInsufficientGasForQuote,
    isInsufficientBalance,
  }) => {
    const warnings: QuoteWarning[] = [];
    isEstimatedReturnLow && warnings.push('low_return');
    isNoQuotesAvailable && warnings.push('no_quotes');
    isInsufficientGasBalance && warnings.push('insufficient_gas_balance');
    isInsufficientGasForQuote &&
      warnings.push('insufficient_gas_for_selected_quote');
    isInsufficientBalance && warnings.push('insufficient_balance');
    return warnings;
  },
);

export const getWasTxDeclined = (state: BridgeAppState): boolean => {
  return state.bridge.wasTxDeclined;
};

/**
 * Checks if the destination chain is Solana and the user has no Solana accounts
 *
 * @param state - The bridge app state
 * @returns True if the destination chain is Solana and the user has no Solana accounts
 */
export const needsSolanaAccountForDestination = createDeepEqualSelector(
  [getToChain, (state: BridgeAppState) => hasSolanaAccounts(state)],
  (toChain, hasSolanaAccount) => {
    if (!toChain) {
      return false;
    }

    const isSolanaDestination = isSolanaChainId(toChain.chainId);

    return isSolanaDestination && !hasSolanaAccount;
  },
);

export const needsBitcoinAccountForDestination = createDeepEqualSelector(
  [getToChain, (state: BridgeAppState) => hasBitcoinAccounts(state)],
  (toChain, hasBitcoinAccount) => {
    if (!toChain) {
      return false;
    }

    const isBitcoinDestination = isBitcoinChainId(toChain.chainId);

    return isBitcoinDestination && !hasBitcoinAccount;
  },
);

export const needsTronAccountForDestination = createDeepEqualSelector(
  [getToChain, (state: BridgeAppState) => hasTronAccounts(state)],
  (toChain, hasTronAccount) => {
    if (!toChain) {
      return false;
    }

    const isTronDestination = isTronChainId(toChain.chainId);

    return isTronDestination && !hasTronAccount;
  },
);

export const getIsToOrFromNonEvm = createSelector(
  [getFromChain, getToChain],
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
  [getFromChain, getToChain],
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
  [getBridgeFeatureFlags, (_state, chainId?: string) => chainId],
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
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (_, isSendBundleSupportedForChain: boolean) =>
      isSendBundleSupportedForChain,
  ],
  (fromChainId, isSendBundleSupportedForChain) => {
    if (!fromChainId) {
      return false;
    }
    return isSendBundleSupportedForChain;
  },
);

export const getIsStxEnabled = createSelector(
  [
    (state: BridgeAppState) => getFromChain(state)?.chainId,
    (state: BridgeAppState) => state,
  ],
  (fromChainId, state) => getIsSmartTransaction(state, fromChainId),
);

export const getIsGasIncluded = createSelector(
  [getIsStxEnabled, getIsGasIncludedSwapSupported],
  (isStxEnabled, isGasIncludedSwapSupported) => {
    return isStxEnabled && isGasIncludedSwapSupported;
  },
);
