import React, { ReactNode, useEffect, useMemo } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { TEST_CHAINS } from '../../../../../shared/constants/network';
import { sortAssets } from '../util/sort';
import {
  getAllNonEvmMetadata,
  getChainIdsToPoll,
  getCurrencyRates,
  getCurrentNetwork,
  getIsTestnet,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getMarketData,
  getNetworkConfigurationIdByChainId,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountNonEvmTokensForCurrentNetwork,
  getSelectedAccountTokensAcrossChains,
  getSelectedInternalAccount,
  getShowFiatInTestnets,
  getTokenExchangeRates,
  getTokenNetworkFilter,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { calculateTokenBalance } from '../util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../util/calculateTokenFiatAmount';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances } from '../../../../hooks/useTokenBalances';
import { setTokenNetworkFilter } from '../../../../store/actions';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getMultichainBalances,
  getMultichainSelectedAccountCachedBalance,
  getMultichainShouldShowFiat,
} from '../../../../selectors/multichain';
import { CaipAssetType } from '@metamask/keyring-api';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  // nativeToken?: ReactNode;
};

export type Token = {
  address: Hex;
};

// TODO: fix this type to be imported directly from multichainassetsController

type FungibleAssetUnit = {
  // Human-friendly name of the asset unit.
  name: string;

  // Ticker symbol of the asset unit.
  symbol: string;

  // Number of decimals of the asset unit.
  decimals: number;
};

export type TokenMetadata = {
  name: string;

  // Ticker symbol of the asset's main unit.
  symbol: string;

  // Whether the asset is native to the chain.
  native: boolean;

  // Represents a fungible asset
  fungible: true;

  // Base64 representation of the asset icon.
  iconUrl: string;

  // List of asset units.
  units: FungibleAssetUnit[]; // does this have to be an array
};

export type TokenWithFiatAmount = TokenMetadata & {
  asset: CaipAssetType;
  tokenFiatAmount: number | null;
  isNative: boolean;
  balance?: string;
  string: string; // needed for backwards compatability TODO: fix this
};

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

const useFilteredAccountTokens = (currentNetwork: { chainId: string }) => {
  const isTestNetwork = useMemo(() => {
    return (TEST_CHAINS as string[]).includes(currentNetwork.chainId);
  }, [currentNetwork.chainId, TEST_CHAINS]);

  const selectedAccountTokensChains: Record<string, Token[]> = useSelector(
    getSelectedAccountTokensAcrossChains,
  ) as Record<string, Token[]>;
  console.log(
    '🚀 ~ useFilteredAccountTokens ~ selectedAccountTokensChains:',
    selectedAccountTokensChains,
  );

  const filteredAccountTokensChains = useMemo(() => {
    return Object.fromEntries(
      Object.entries(selectedAccountTokensChains || {}).filter(([chainId]) =>
        isTestNetwork
          ? (TEST_CHAINS as string[]).includes(chainId)
          : !(TEST_CHAINS as string[]).includes(chainId),
      ),
    );
  }, [selectedAccountTokensChains, isTestNetwork, TEST_CHAINS]);

  return filteredAccountTokensChains;
};

export default function TokenListNonEvm({
  onTokenClick,
}: // nativeToken,
TokenListProps) {
  console.log('=============1');
  const dispatch = useDispatch();
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationIdByChainId);
  const { tokenSortConfig, privacyMode, hideZeroBalanceTokens } =
    useSelector(getPreferences);
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const internalAccount = useSelector(getSelectedInternalAccount);
  console.log('🚀 ~ internalAccount:', internalAccount);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const newTokensImported = useSelector(getNewTokensImported);
  // const selectedAccountTokensChains = useFilteredAccountTokens(currentNetwork);

  const selectedAccountTokens: CaipAssetType[] = useSelector(
    getSelectedAccountNonEvmTokensForCurrentNetwork,
  );
  console.log('🚀 ~ selectedAccountTokens:', selectedAccountTokens);

  const selectedAccountTokensMetadata = useSelector(getAllNonEvmMetadata);
  console.log(
    '🚀 ~ selectedAccountTokensMetadata:',
    selectedAccountTokensMetadata,
  );

  const isOnCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );
  console.log('=============3');

  /*   const { tokenBalances } = useTokenBalances({
    chainIds: chainIdsToPoll as Hex[],
  }); */
  /*   const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address]; */

  /*   const marketData: ChainAddressMarketData = useSelector(
    getMarketData,
  ) as ChainAddressMarketData;

  const currencyRates = useSelector(getCurrencyRates); */
  const nativeBalance = useSelector(getMultichainSelectedAccountCachedBalance);
  const tokenBalancesNonEvm = useSelector(getMultichainBalances); //getMultichainBalances
  console.log('🚀 ~ tokenBalancesNonEvm:', tokenBalancesNonEvm);

  const tokenBalancesForCurrentAccount =
    tokenBalancesNonEvm[internalAccount.id];
  console.log(
    '🚀 ~ tokenBalancesForCurrentAccount:',
    tokenBalancesForCurrentAccount,
  );

  const isTestnet = useSelector(getIsTestnet);

  console.log('=============4');
  const consolidatedBalances = () => {
    const tokensWithBalance: TokenWithFiatAmount[] = [];
    selectedAccountTokens.forEach((asset) => {
      //  const chainId = stringChainKey as Hex;
      //   tokens.forEach((token: Token) => {
      //   const { isNative, address, decimals } = token;
      const isNative = !asset.split('/')[1].startsWith('token');
      const assetMetadata = selectedAccountTokensMetadata[asset];
      let balance;
      if (isNative) {
        balance = nativeBalance;
      } else {
        //  const assetBalance = tokenBalancesForCurrentAccount[asset];
        balance = '0';
      }

      /*         calculateTokenBalance({
          isNative,
          chainId,
          address,
          decimals: assetMetadata.units[0].decimals,
          nativeBalances,
          selectedAccountTokenBalancesAcrossChains,
        }) || '0'; */

      const tokenFiatAmount = 33;

      /*           calculateTokenFiatAmount({
            token,
            chainId,
            balance,
            marketData,
            currencyRates,
          }); */

      // Respect the "hide zero balance" setting (when true):
      // - Native tokens should always display with zero balance when on the current network filter.
      // - Native tokens should not display with zero balance when on all networks filter
      // - ERC20 tokens with zero balances should respect the setting on both the current and all networks.

      // Respect the "hide zero balance" setting (when false):
      // - Native tokens should always display with zero balance when on the current network filter.
      // - Native tokens should always display with zero balance when on all networks filter
      // - ERC20 tokens always display with zero balance on both the current and all networks filter.
      if (
        !hideZeroBalanceTokens ||
        balance !== '0' ||
        (isNative && isOnCurrentNetwork)
      ) {
        tokensWithBalance.push({
          ...assetMetadata,
          asset,
          balance,
          tokenFiatAmount,
          isNative,
          //chainId,
          string: String(balance),
        });
      }
      // });
    });

    return tokensWithBalance;
  };

  const sortedFilteredTokens = useMemo(() => {
    const consolidatedTokensWithBalances = consolidatedBalances();
    console.log(
      '🚀 ~ sortedFilteredTokens ~ consolidatedTokensWithBalances:',
      consolidatedTokensWithBalances,
    );

    /*     const { nativeTokens, nonNativeTokens } =
      consolidatedTokensWithBalances.reduce<{
        nativeTokens: TokenWithFiatAmount[];
        nonNativeTokens: TokenWithFiatAmount[];
      }>(
        (acc, token) => {
          if (token.isNative) {
            acc.nativeTokens.push(token);
          } else {
            acc.nonNativeTokens.push(token);
          }
          return acc;
        },
        { nativeTokens: [], nonNativeTokens: [] },
      );
    const assets = [...nativeTokens, ...nonNativeTokens]; */
    return consolidatedTokensWithBalances;
    //return sortAssets(assets, tokenSortConfig);
  }, [
    tokenSortConfig,
    tokenNetworkFilter,
    conversionRate,
    contractExchangeRates,
    currentNetwork,
    selectedAccount,
    //  selectedAccountTokensChains,
    newTokensImported,
  ]);

  console.log('🚀 ~ TokenList ~ sortedFilteredTokens:', sortedFilteredTokens);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  // Displays nativeToken if provided
  /*   if (nativeToken) {
    return React.cloneElement(nativeToken as React.ReactElement);
  } */

  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );
  const isMainnet = !isTestnet;
  // Check if show conversion is enabled
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  return (
    <div>
      {sortedFilteredTokens.map((tokenData) => (
        <TokenCell
          key={`${tokenData.symbol}-${tokenData.asset}`}
          chainId={tokenData.asset.split('/')[0]}
          address={tokenData.asset}
          symbol={tokenData.symbol}
          tokenFiatAmount={showFiat ? tokenData.tokenFiatAmount : null}
          image={tokenData?.iconUrl}
          isNative={tokenData.isNative}
          string={tokenData.string}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
