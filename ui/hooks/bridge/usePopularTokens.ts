import { useEffect, useMemo, useRef } from 'react';
import { type CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { useAsyncResult } from '../useAsync';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { BridgeToken } from '../../ducks/bridge/types';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { type BridgeAppState } from '../../ducks/bridge/selectors';
import { getBridgeAssetsByAssetId } from '../../ducks/bridge/asset-selectors';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { fetchPopularTokens } from '../../pages/bridge/utils/tokens';

/**
 * Returns a sorted token list from the bridge api
 * - tokens with highest to lowest balance in selected currency
 * - selected asset
 * - popularity
 * - all other tokens
 *
 * @param params
 * @param params.chainIds - enabled src/dest chainIds to return tokens for
 * @param params.accountAddress - the account address used for balances
 * @param params.assetsToInclude - the assets to show at the top of the list
 */
export const usePopularTokens = ({
  assetsToInclude,
  accountAddress,
  chainIds,
}: {
  chainIds: Set<CaipChainId>;
  assetsToInclude: BridgeToken[];
  accountAddress: string;
}) => {
  const [accountGroup] = useSelector((state: BridgeAppState) =>
    getAccountGroupsByAddress(state, [accountAddress]),
  );
  const balanceByAssetId = useSelector((state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, accountGroup.id),
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const { value: tokenList, pending: isTokenListLoading } =
    useAsyncResult(async () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      const response = await fetchPopularTokens({
        chainIds: Array.from(chainIds),
        assetsWithBalances: assetsToInclude,
        clientId: BridgeClientId.EXTENSION,
        signal: abortControllerRef.current?.signal,
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      });
      return response;
    }, [assetsToInclude]);

  const tokenListWithBalance = useMemo(() => {
    return (
      tokenList?.map(toBridgeToken).map((token) => {
        const balanceData =
          balanceByAssetId?.[token.assetId] ?? // non-EVM assetIds are not lowercased
          balanceByAssetId?.[
            token.assetId.toLowerCase() as keyof typeof balanceByAssetId
          ];
        return {
          ...token,
          accountType: balanceData?.accountType,
          balance: balanceData?.balance,
          tokenFiatAmount: balanceData?.tokenFiatAmount,
        };
      }) ?? assetsToInclude.map(toBridgeToken)
    );
  }, [tokenList, assetsToInclude, balanceByAssetId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    popularTokensList:
      isTokenListLoading || tokenList?.length === 0
        ? assetsToInclude.map(toBridgeToken)
        : tokenListWithBalance,
    isLoading: isTokenListLoading || tokenList?.length === 0,
  };
};
