import { useEffect, useMemo, useRef } from 'react';
import { type AccountGroupId } from '@metamask/account-api';
import { useSelector } from 'react-redux';
import { BridgeToken } from '../../ducks/bridge/types';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { type BridgeAppState } from '../../ducks/bridge/selectors';
import { getBridgeAssetsByAssetId } from '../../ducks/bridge/asset-selectors';
import { type BridgeAssetV2 } from '../../pages/bridge/utils/tokens';
import { useAsyncResult } from '../useAsync';

/**
 * Returns a sorted token list from the bridge api
 * - tokens with highest to lowest balance in selected currency
 * - selected asset
 * - popularity
 * - all other tokens
 *
 * @param params
 * @param params.accountGroupId - the account group id used for balances
 * @param params.assetsToInclude - the assets to show at the top of the list
 * @param params.fetchTokens - a function to fetch the popular tokens list
 */
export const usePopularTokens = ({
  fetchTokens,
  assetsToInclude,
  accountGroupId,
}: {
  fetchTokens: (signal?: AbortSignal) => Promise<BridgeAssetV2[]>;
  assetsToInclude: BridgeToken[];
  accountGroupId?: AccountGroupId;
}) => {
  const ownedAssetsByAssetId = useSelector((state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, accountGroupId),
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const { value: tokenList, pending: isTokenListLoading } =
    useAsyncResult(async () => {
      abortControllerRef.current?.abort('ChainIds or asset balances changed');
      abortControllerRef.current = new AbortController();
      return await fetchTokens(abortControllerRef.current?.signal);
    }, [fetchTokens]);

  const tokenListWithBalance = useMemo(() => {
    return tokenList?.map((token) =>
      toBridgeToken(
        token,
        ownedAssetsByAssetId?.[
          // Balance keys are lowercased for easier lookup
          token.assetId.toLowerCase() as keyof typeof ownedAssetsByAssetId
        ],
      ),
    );
  }, [tokenList, ownedAssetsByAssetId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort('Component unmounted');
    };
  }, []);

  return {
    popularTokensList:
      tokenListWithBalance && tokenListWithBalance.length > 0
        ? tokenListWithBalance
        : assetsToInclude,
    isLoading: isTokenListLoading || tokenListWithBalance?.length === 0,
  };
};
