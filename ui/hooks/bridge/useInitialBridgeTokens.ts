import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { type CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { uniqBy } from 'lodash';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getBearerToken } from '../../store/actions';
import { fetchPopularTokens } from '../../pages/bridge/utils/tokens';
import { getUseExternalServices } from '../../selectors';
import { useAsyncResult } from '../useAsync';
import {
  getFromAccount,
  BridgeAppState,
  getFromChains,
} from '../../ducks/bridge/selectors';
import { getBridgeSortedAssets } from '../../ducks/bridge/asset-selectors';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { toBridgeToken } from '../../ducks/bridge/utils';

/**
 * Builds the params for the fetchPopularTokens function
 *
 * @param chainIds - enabled src/dest chainIds to return tokens for
 */
export const useInitialBridgeTokens = (chainIds?: Set<CaipChainId>) => {
  const isExternalServicesEnabled = useSelector(getUseExternalServices);

  const fromChains = useSelector(getFromChains);
  const fromAccount = useSelector(getFromAccount);
  const groupId = useSelector((state: BridgeAppState) =>
    getAccountGroupsByAddress(state, [fromAccount?.address]),
  )[0]?.id;
  const fromChainIds = useMemo(
    () => new Set(fromChains.map((chain) => chain.chainId)),
    [fromChains],
  );
  const chainIdsToUse = chainIds ?? fromChainIds;
  const assetsWithBalance = useSelector((state: BridgeAppState) =>
    getBridgeSortedAssets(state, groupId),
  );

  const assetsToInclude = useMemo(
    () =>
      uniqBy(
        assetsWithBalance.filter((token) => {
          const matchesChainIdFilter = chainIdsToUse.has(token.chainId);

          return matchesChainIdFilter;
        }),
        (a) => a.assetId?.toLowerCase(),
      ),
    [chainIdsToUse, assetsWithBalance],
  );

  const { value: jwt } = useAsyncResult(async () => {
    if (!isExternalServicesEnabled) {
      return undefined;
    }
    return await getBearerToken();
  }, [isExternalServicesEnabled]);

  /*
   * Combine asset IDs into a string to avoid re-fetching
   * results whenever the balance or fiat balance amount changes
   */
  const assetsToIncludeId = useMemo(() => {
    return assetsToInclude.map(({ assetId }) => assetId).join('|');
  }, [assetsToInclude]);

  const fetchTokens = useCallback(
    async (signal?: AbortSignal) => {
      if (!jwt || !isExternalServicesEnabled) {
        return assetsToInclude;
      }
      const response = await fetchPopularTokens({
        jwt,
        chainIds: Array.from(chainIdsToUse),
        assetsWithBalances: assetsToInclude,
        clientId: BridgeClientId.EXTENSION,
        clientVersion: process.env.METAMASK_VERSION,
        signal,
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      });
      return response;
    },
    [assetsToIncludeId, chainIdsToUse, jwt, isExternalServicesEnabled],
  );

  return {
    assetsToInclude: assetsToInclude.map((token) => toBridgeToken(token)),
    fetchTokens,
  };
};
