import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  parseCaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import { SolScope, BtcScope } from '@metamask/keyring-api';
import { type InternalAccount } from '@metamask/keyring-internal-api';
import { BigNumber } from 'bignumber.js';
import { AssetType } from '../../shared/constants/transaction';
import type { TokenWithBalance } from '../components/app/assets/types';
import {
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
  getTokenBalancesEvm,
} from '../selectors/assets';
import { getMultichainBalances } from '../selectors/multichain';
import {
  getAccountGroupsByAddress,
  getInternalAccountByGroupAndCaip,
  getSelectedAccountGroup,
} from '../selectors/multichain-accounts/account-tree';
import { type MultichainAccountsState } from '../selectors/multichain-accounts/account-tree.types';
import { useMultichainSelector } from './useMultichainSelector';

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
 * @param accountAddress - the accountAddress to use for the token list, if not provided, the selected account will be used
 */
export const useMultichainBalances = (
  accountAddress?: InternalAccount['address'],
) => {
  // Use accountAddress's account group if it exists, otherwise use the selected account group
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const [requestedAccountGroup] = useSelector((state) =>
    getAccountGroupsByAddress(state as MultichainAccountsState, [
      accountAddress ?? '',
    ]),
  );
  const accountGroupIdToUse = requestedAccountGroup?.id ?? selectedAccountGroup;

  // Get internal account to use for each supported scope
  const evmAccount = useSelector((state) =>
    getInternalAccountByGroupAndCaip(state, accountGroupIdToUse, 'eip155:1'),
  );
  const solanaAccount = useSelector((state) =>
    getInternalAccountByGroupAndCaip(
      state,
      accountGroupIdToUse,
      SolScope.Mainnet,
    ),
  );
  const bitcoinAccount = useSelector((state) =>
    getInternalAccountByGroupAndCaip(
      state,
      accountGroupIdToUse,
      BtcScope.Mainnet,
    ),
  );

  // EVM balances
  const evmBalancesWithFiatByChainId = useSelector((state) =>
    getTokenBalancesEvm(state, evmAccount?.address),
  );
  // Solana balances
  const solanaBalancesWithFiat = useNonEvmAssetsWithBalances(solanaAccount?.id);
  // Bitcoin balances
  const bitcoinBalancesWithFiat = useNonEvmAssetsWithBalances(
    bitcoinAccount?.id,
  );

  // return TokenWithFiat sorted by fiat balance amount
  const assetsWithBalance = useMemo(() => {
    return [
      ...evmBalancesWithFiatByChainId,
      ...solanaBalancesWithFiat,
      ...bitcoinBalancesWithFiat,
    ]
      .map((token) => ({
        ...token,
        type: token.isNative ? AssetType.native : AssetType.token,
      }))
      .sort((a, b) => (b.tokenFiatAmount ?? 0) - (a.tokenFiatAmount ?? 0));
  }, [
    evmBalancesWithFiatByChainId,
    solanaBalancesWithFiat,
    bitcoinBalancesWithFiat,
  ]);

  // return total fiat balances by chainId/caipChainId
  const balanceByChainId = useMemo(() => {
    return [
      ...evmBalancesWithFiatByChainId,
      ...solanaBalancesWithFiat,
      ...bitcoinBalancesWithFiat,
    ].reduce((acc: Record<Hex | CaipChainId, number>, tokenWithBalanceData) => {
      if (!acc[tokenWithBalanceData.chainId]) {
        acc[tokenWithBalanceData.chainId] = 0;
      }
      acc[tokenWithBalanceData.chainId] +=
        tokenWithBalanceData.tokenFiatAmount ?? 0;
      return acc;
    }, {});
  }, [
    evmBalancesWithFiatByChainId,
    solanaBalancesWithFiat,
    bitcoinBalancesWithFiat,
  ]);

  return { assetsWithBalance, balanceByChainId };
};
