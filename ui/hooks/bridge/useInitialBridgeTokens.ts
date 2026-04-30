import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { type CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getBearerToken } from '../../store/actions';
import { BridgeToken } from '../../ducks/bridge/types';
import { fetchPopularTokens } from '../../pages/bridge/utils/tokens';
import { getIsExternalServicesEnabled } from '../../ducks/bridge/selectors';
import { useAsyncResult } from '../useAsync';

/**
 * Fetches the popular tokens list from the bridge api
 *
 * @param params
 * @param params.chainIds - enabled src/dest chainIds to return tokens for
 * @param params.assetsToInclude - the assets to show at the top of the list
 */
export const useInitialBridgeTokens = ({
  assetsToInclude,
  chainIds,
}: {
  chainIds: Set<CaipChainId>;
  assetsToInclude: BridgeToken[];
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isExternalServicesEnabled = useSelector(getIsExternalServicesEnabled);

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

  const { value: tokenList, pending: isTokenListLoading } =
    useAsyncResult(async () => {
      if (!jwt || !isExternalServicesEnabled) {
        return assetsToInclude;
      }
      abortControllerRef.current?.abort('Asset balances changed');
      abortControllerRef.current = new AbortController();
      const response = await fetchPopularTokens({
        jwt,
        chainIds: Array.from(chainIds),
        assetsWithBalances: assetsToInclude,
        clientId: BridgeClientId.EXTENSION,
        clientVersion: process.env.METAMASK_VERSION,
        signal: abortControllerRef.current?.signal,
        bridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      });
      return response;
    }, [assetsToIncludeId, chainIds, jwt, isExternalServicesEnabled]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort('Page unmounted');
    };
  }, []);

  return {
    tokenList,
    isTokenListLoading,
  };
};
