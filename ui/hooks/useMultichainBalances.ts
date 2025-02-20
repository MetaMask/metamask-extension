import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId, Hex } from '@metamask/utils';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import { BigNumber } from 'bignumber.js';
import { NetworkConfiguration } from '@metamask/network-controller';
import { zeroAddress } from 'ethereumjs-util';
import {
  getCurrencyRates,
  getMarketData,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedEvmInternalAccount,
  selectERC20TokensByChain,
} from '../selectors';
import type {
  ChainAddressMarketData,
  TokenWithBalance,
} from '../components/app/assets/types';
import {
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
} from '../selectors/assets';
import {
  getLastSelectedNonEvmAccount,
  getMultichainBalances,
  getMultichainCoinRates,
} from '../selectors/multichain';
import { calcTokenAmount } from '../../shared/lib/transactions-controller-utils';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../shared/constants/network';
import { AssetType } from '../../shared/constants/transaction';
import { useTokenBalances } from './useTokenBalances';
import { useMultichainSelector } from './useMultichainSelector';

const useEvmAssetsWithBalances = (): (
  | TokenWithBalance & {
      chainId: Hex;
      decimals: number;
      string: string;
      tokenFiatAmount: number;
      balance: string;
    }
)[] => {
  const { address: evmAccountAddress } = useMultichainSelector(
    getSelectedEvmInternalAccount,
  );

  // all ERC20 tokens for imported chainIds, addresses in lowercase hex
  const tokenMetadataByAddressByChain = useSelector(selectERC20TokensByChain);

  // balances by chainId
  const tokenBalancesByChain: Record<
    Hex,
    Record<Hex, string>
  > = useTokenBalances().tokenBalances[evmAccountAddress];
  const nativeBalancesByChain = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<string, Hex>;

  // conversion rates by chainId and hex token address
  const tokenRates = useSelector(getMarketData) as ChainAddressMarketData;
  // conversion rates by native token ticker
  const nativeRates = useSelector(
    getCurrencyRates,
  ) as CurrencyRateState['currencyRates'];

  const networkConfigByChainId: Record<string, NetworkConfiguration> =
    useSelector(getNetworkConfigurationsByChainId);

  // TODO: use getTokenBalancesEvm
  const evmTokensWithFiatBalances = useMemo(() => {
    return Object.entries(tokenBalancesByChain).flatMap(
      ([chainId, tokenBalances]) => {
        const nativeBalance = calcTokenAmount(
          new BigNumber(nativeBalancesByChain[chainId] ?? '0', 16),
          18,
        ).toString();
        const nativeExchangeRate =
          nativeRates[
            networkConfigByChainId[chainId]?.nativeCurrency ?? 'ETH'
          ]?.conversionRate?.toString() ?? '0';
        const nativeBalanceInFiat = new BigNumber(nativeBalance).times(
          nativeExchangeRate,
        );

        const tokensWithBalances = Object.entries(tokenBalances)
          // build TokenWithFiat for each token balance detected
          .map(([tokenAddress, tokenBalance]) => {
            const tokenMetadata =
              tokenMetadataByAddressByChain[chainId]?.data?.[
                tokenAddress.toLowerCase()
              ];
            if (!tokenMetadata) {
              return null;
            }
            const tokenAmount = calcTokenAmount(
              tokenBalance,
              tokenMetadata?.decimals ?? 18,
            );
            const tokenPrice =
              tokenRates[chainId as Hex]?.[
                tokenAddress as Hex
              ].price.toString();
            const fiatBalance = tokenAmount
              .times(tokenPrice ?? '0')
              .times(nativeExchangeRate);
            // Data for ERC20 tokens
            return {
              string: tokenAmount.toString(),
              balance: tokenAmount.toString(),
              tokenFiatAmount: fiatBalance.toNumber(),
              chainId: chainId as Hex,
              decimals: tokenMetadata?.decimals ?? 18,
              address: tokenAddress as Hex,
              symbol: tokenMetadata?.symbol ?? '',
              image: tokenMetadata?.iconUrl ?? '',
            };
          })
          .filter((token) => token !== null);

        // Data for native token
        tokensWithBalances.push({
          string: nativeBalance,
          balance: nativeBalance,
          tokenFiatAmount: nativeBalanceInFiat.toNumber(),
          chainId: chainId as Hex,
          decimals: 18,
          address: zeroAddress() as Hex,
          symbol: networkConfigByChainId[chainId]?.nativeCurrency ?? '',
          image:
            CHAIN_ID_TOKEN_IMAGE_MAP[
              chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
            ],
        });

        return tokensWithBalances;
      },
    );
  }, [
    nativeBalancesByChain,
    nativeRates,
    tokenBalancesByChain,
    tokenMetadataByAddressByChain,
    tokenRates,
    networkConfigByChainId,
  ]);

  return evmTokensWithFiatBalances;
};

const useNonEvmAssetsWithBalances = (): (Omit<
  TokenWithBalance,
  'address' | 'chainId'
> & {
  chainId: `${string}:${string}`;
  decimals: number;
  address: `${string}:${string}`;
  string: string;
  balance: string;
  tokenFiatAmount: number;
  symbol: string;
})[] => {
  const nonEvmAccount = useSelector(getLastSelectedNonEvmAccount);

  // non-evm tokens owned by non-evm account, includes native and non-native assets
  const assetsByAccountId = useSelector(getAccountAssets);
  const assetIds = assetsByAccountId[nonEvmAccount.id];
  const assetMetadataById = useSelector(getAssetsMetadata);

  // includes native and asset balances for non-evm account
  const nonEvmBalancesByAccountId = useMultichainSelector(
    getMultichainBalances,
  );
  const balancesByAssetId = nonEvmBalancesByAccountId[nonEvmAccount.id];

  // native exchange rates
  const nativeRates = useSelector(getMultichainCoinRates);
  // asset exchange rates
  const assetRates = useSelector(getAssetsRates);

  const nonEvmTokensWithFiatBalances = useMemo(() => {
    // build TokenWithFiat for each asset
    return assetIds.map((caipAssetId) => {
      const [caipChainId, address] = caipAssetId.split('/');
      const [type] = address.split(':');
      return {
        chainId: caipChainId as `${string}:${string}`,
        symbol: assetMetadataById[caipAssetId]?.symbol ?? '',
        address: address as `${string}:${string}`,
        string: balancesByAssetId[caipAssetId]?.amount ?? '0',
        balance: balancesByAssetId[caipAssetId]?.amount ?? '0',
        decimals: assetMetadataById[caipAssetId]?.units[0]?.decimals,
        image: assetMetadataById[caipAssetId]?.iconUrl ?? '',
        type: type === 'token' ? AssetType.token : AssetType.native,
        tokenFiatAmount: new BigNumber(
          balancesByAssetId[caipAssetId]?.amount ?? '1',
        )
          .times(
            assetRates?.[caipAssetId]?.rate ??
              nativeRates?.[
                assetMetadataById[caipAssetId]?.units[0]?.symbol.toLowerCase()
              ]?.conversionRate ??
              '1',
          )
          .toNumber(),
      };
    });
  }, [assetMetadataById, assetRates, assetIds, balancesByAssetId, nativeRates]);

  return nonEvmTokensWithFiatBalances;
};

// TODO replace this with getMultichainAssets
// This hook is used to get the balances of all tokens and native tokens across all chains
// This also returns the total fiat balances by chainId/caipChainId
export const useMultichainBalances = () => {
  // EVM data
  const evmBalancesWithFiatByChainId = useEvmAssetsWithBalances();
  // Non-EVM data
  const nonEvmBalancesWithFiatByChainId = useNonEvmAssetsWithBalances();

  // return TokenWithFiat sorted by fiat balance amount
  const assetsWithBalance = useMemo(() => {
    return [
      ...evmBalancesWithFiatByChainId,
      ...nonEvmBalancesWithFiatByChainId,
    ].sort((a, b) => (b.tokenFiatAmount ?? 0) - (a.tokenFiatAmount ?? 0));
  }, [evmBalancesWithFiatByChainId, nonEvmBalancesWithFiatByChainId]);

  // return total fiat balances by chainId/caipChainId
  const balanceByChainId = useMemo(() => {
    return [
      ...evmBalancesWithFiatByChainId,
      ...nonEvmBalancesWithFiatByChainId,
    ].reduce((acc: Record<Hex | CaipChainId, number>, tokenWithBalanceData) => {
      if (!acc[tokenWithBalanceData.chainId]) {
        acc[tokenWithBalanceData.chainId] = 0;
      }
      acc[tokenWithBalanceData.chainId] +=
        tokenWithBalanceData.tokenFiatAmount ?? 0;
      return acc;
    }, {});
  }, [evmBalancesWithFiatByChainId, nonEvmBalancesWithFiatByChainId]);

  return { assetsWithBalance, balanceByChainId };
};
