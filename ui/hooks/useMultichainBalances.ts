import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId, Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import type { TokenWithBalance } from '../components/app/assets/types';
import {
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
  getTokenBalancesEvm,
} from '../selectors/assets';
import {
  getLastSelectedNonEvmAccount,
  getMultichainBalances,
  getMultichainCoinRates,
} from '../selectors/multichain';
import { AssetType } from '../../shared/constants/transaction';
import { getSelectedEvmInternalAccount } from '../selectors/selectors';
import { useMultichainSelector } from './useMultichainSelector';

// TODO replace this with getMultichainAssets
const useNonEvmAssetsWithBalances = (): (
  | Omit<TokenWithBalance, 'address' | 'chainId' | 'primary' | 'secondary'> & {
      chainId: `${string}:${string}`;
      decimals: number;
      address: `${string}:${string}`;
      string: string;
      balance: string;
      tokenFiatAmount: number;
      symbol: string;
    }
)[] => {
  const nonEvmAccount = useSelector(getLastSelectedNonEvmAccount);
  // non-evm tokens owned by non-evm account, includes native and non-native assets
  const assetsByAccountId = useSelector(getAccountAssets);
  const assetMetadataById = useSelector(getAssetsMetadata);

  // includes native and asset balances for non-evm account
  const nonEvmBalancesByAccountId = useMultichainSelector(
    getMultichainBalances,
  );
  // native exchange rates
  const nativeRates = useSelector(getMultichainCoinRates);
  // asset exchange rates
  const assetRates = useSelector(getAssetsRates);

  const nonEvmTokensWithFiatBalances = useMemo(() => {
    if (!nonEvmAccount?.id) {
      return [];
    }

    const assetIds = assetsByAccountId?.[nonEvmAccount.id];
    const balancesByAssetId = nonEvmBalancesByAccountId?.[nonEvmAccount.id];
    if (!balancesByAssetId || !assetIds) {
      return [];
    }
    // build TokenWithFiat for each asset
    return assetIds
      .filter((caipAssetId) => assetMetadataById[caipAssetId])
      .map((caipAssetId) => {
        const [caipChainId, address] = caipAssetId.split('/');
        const [type] = address.split(':');
        return {
          chainId: caipChainId as `${string}:${string}`,
          symbol: assetMetadataById[caipAssetId]?.symbol ?? '',
          address: caipAssetId,
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
      })
      .filter(Boolean);
  }, [
    assetMetadataById,
    assetRates,
    assetsByAccountId,
    nativeRates,
    nonEvmAccount?.id,
    nonEvmBalancesByAccountId,
  ]);

  return nonEvmTokensWithFiatBalances;
};

// This hook is used to get the balances of all tokens and native tokens across all chains
// This also returns the total fiat balances by chainId/caipChainId
export const useMultichainBalances = () => {
  // EVM data
  const selectedAccount = useSelector(getSelectedEvmInternalAccount);
  const evmBalancesWithFiatByChainId = useSelector((state) =>
    getTokenBalancesEvm(state, selectedAccount.address),
  );
  // Non-EVM data
  const nonEvmBalancesWithFiatByChainId = useNonEvmAssetsWithBalances();

  // return TokenWithFiat sorted by fiat balance amount
  const assetsWithBalance = useMemo(() => {
    return [...evmBalancesWithFiatByChainId, ...nonEvmBalancesWithFiatByChainId]
      .map((token) => ({
        ...token,
        type: token.isNative ? AssetType.native : AssetType.token,
      }))
      .sort((a, b) => (b.tokenFiatAmount ?? 0) - (a.tokenFiatAmount ?? 0));
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
