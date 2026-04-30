import { useMemo } from 'react';
import { type CaipChainId } from '@metamask/utils';
import { type AccountGroupId } from '@metamask/account-api';
import { useSelector } from 'react-redux';
import { BridgeToken } from '../../ducks/bridge/types';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { type BridgeAppState } from '../../ducks/bridge/selectors';
import { getBridgeAssetsByAssetId } from '../../ducks/bridge/asset-selectors';
import { useInitialBridgeTokens } from './useInitialBridgeTokens';

/**
 * Returns a sorted token list from the bridge api
 * - tokens with highest to lowest balance in selected currency
 * - selected asset
 * - popularity
 * - all other tokens
 *
 * @param params
 * @param params.chainIds - enabled src/dest chainIds to return tokens for
 * @param params.accountGroupId - the account group id used for balances
 * @param params.assetsToInclude - the assets to show at the top of the list
 */
export const usePopularTokens = ({
  assetsToInclude,
  accountGroupId,
  chainIds,
}: {
  chainIds: Set<CaipChainId>;
  assetsToInclude: BridgeToken[];
  accountGroupId?: AccountGroupId;
}) => {
  const ownedAssetsByAssetId = useSelector((state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, accountGroupId),
  );

  const { tokenList, isTokenListLoading } = useInitialBridgeTokens({
    assetsToInclude,
    chainIds,
  });

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

  return {
    popularTokensList:
      tokenListWithBalance && tokenListWithBalance.length > 0
        ? tokenListWithBalance
        : assetsToInclude,
    isLoading: isTokenListLoading || tokenListWithBalance?.length === 0,
  };
};
