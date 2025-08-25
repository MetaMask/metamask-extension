import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  parseCaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
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
} from '../selectors/multichain';
import { AssetType } from '../../shared/constants/transaction';
import {
  getInternalAccount,
  getSelectedEvmInternalAccount,
} from '../selectors/selectors';
import { useMultichainSelector } from './useMultichainSelector';

// TODO replace this with getMultichainAssets
const useNonEvmAssetsWithBalances = (
  accountId?: string,
): (Omit<TokenWithBalance, 'address' | 'chainId' | 'primary' | 'secondary'> & {
  chainId: `${string}:${string}`;
  decimals: number;
  address: string;
  assetId: `${string}:${string}`;
  string: string;
  balance: string;
  tokenFiatAmount: number;
  symbol: string;
})[] => {
  // non-evm tokens owned by non-evm account, includes native and non-native assets
  const assetsByAccountId = useSelector(getAccountAssets);
  const assetMetadataById = useSelector(getAssetsMetadata);

  // includes native and asset balances for non-evm account
  const nonEvmBalancesByAccountId = useMultichainSelector(
    getMultichainBalances,
  );
  // asset exchange rates
  const assetRates = useSelector(getAssetsRates);

  const nonEvmTokensWithFiatBalances = useMemo(() => {
    if (!accountId) {
      return [];
    }

    const assetIds = assetsByAccountId?.[accountId];
    const balancesByAssetId = nonEvmBalancesByAccountId?.[accountId];
    if (!balancesByAssetId || !assetIds) {
      return [];
    }
    // build TokenWithFiat for each asset
    return assetIds
      .filter((caipAssetId) => assetMetadataById[caipAssetId])
      .map((caipAssetId) => {
        const { chainId, assetReference, assetNamespace } =
          parseCaipAssetType(caipAssetId);
        return {
          chainId,
          symbol: assetMetadataById[caipAssetId]?.symbol ?? '',
          assetId: caipAssetId,
          address: assetReference,
          string: balancesByAssetId[caipAssetId]?.amount ?? '0',
          balance: balancesByAssetId[caipAssetId]?.amount ?? '0',
          decimals: assetMetadataById[caipAssetId]?.units[0]?.decimals,
          image: assetMetadataById[caipAssetId]?.iconUrl ?? '',
          type: assetNamespace === 'token' ? AssetType.token : AssetType.native,
          tokenFiatAmount: new BigNumber(
            balancesByAssetId[caipAssetId]?.amount ?? '1',
          )
            .times(assetRates?.[caipAssetId]?.rate ?? '1')
            .toNumber(),
        };
      })
      .filter(Boolean);
  }, [
    assetMetadataById,
    assetRates,
    assetsByAccountId,
    accountId,
    nonEvmBalancesByAccountId,
  ]);

  return nonEvmTokensWithFiatBalances;
};

/**
 * This hook is used to get the balances of all tokens and native tokens across all chains
 * This also returns the total fiat balances by chainId/caipChainId
 *
 * @param accountId - the accountId to use for the token list, if not provided, the selected account will be used
 */
export const useMultichainBalances = (accountId?: string) => {
  // EVM data
  const selectedAccount = useSelector(getSelectedEvmInternalAccount);
  const requestedAccount = useSelector((state) =>
    getInternalAccount(state, accountId ?? ''),
  );
  const evmAccount = accountId ? requestedAccount : selectedAccount;

  const evmBalancesWithFiatByChainId = useSelector((state) =>
    getTokenBalancesEvm(state, evmAccount?.address),
  );
  // Non-EVM data
  const nonEvmAccount = useSelector(getLastSelectedNonEvmAccount);
  const nonEvmBalancesWithFiatByChainId = useNonEvmAssetsWithBalances(
    accountId ?? nonEvmAccount?.id,
  );

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
