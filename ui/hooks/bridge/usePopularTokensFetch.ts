import { useEffect, useMemo, useRef } from 'react';
import { type CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getBearerToken } from '../../store/actions';
import { BridgeToken } from '../../ducks/bridge/types';
import {
  fetchPopularTokens,
  toMinimalAsset,
} from '../../pages/bridge/utils/tokens';
import { useAsyncResult } from '../useAsync';

/**
 * Fetches the popular tokens list from the bridge api
 *
 * @param params
 * @param params.chainIds - enabled src/dest chainIds to return tokens for
 * @param params.assetsToInclude - the assets to show at the top of the list
 */
export const usePopularTokensFetch = ({
  assetsToInclude,
  chainIds,
}: {
  chainIds: Set<CaipChainId>;
  assetsToInclude: BridgeToken[];
}) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const { value: jwt } = useAsyncResult(async () => {
    return await getBearerToken();
  }, []);

  const minimalAssetsToInclude = useMemo(() => {
    return assetsToInclude.map(toMinimalAsset);
  }, [assetsToInclude]);

  const { value: tokenList, pending: isTokenListLoading } =
    useAsyncResult(async () => {
      if (!jwt) {
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
    }, [minimalAssetsToInclude.toString(), jwt]);

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
