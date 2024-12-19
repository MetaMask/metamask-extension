import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAllBridgeableNetworks } from '../../ducks/bridge/selectors';
import { fetchBridgeTokens } from '../../../shared/modules/bridge-utils/bridge.util';

// This hook is used to fetch the bridge tokens for all bridgeable networks
export const useBridgeTokens = () => {
  const allBridgeChains = useSelector(getAllBridgeableNetworks);

  const [tokenAllowlistByChainId, setTokenAllowlistByChainId] = useState<
    Record<string, Set<string>>
  >({});

  useEffect(() => {
    const tokenAllowlistPromises = Promise.allSettled(
      allBridgeChains.map(
        async ({ chainId }) =>
          await fetchBridgeTokens(chainId).then((tokens) => ({
            [chainId]: new Set(Object.keys(tokens)),
          })),
      ),
    );

    (async () => {
      const results = await tokenAllowlistPromises;
      const tokenAllowlistResults = Object.fromEntries(
        results.map((result) => {
          if (result.status === 'fulfilled') {
            return Object.entries(result.value)[0];
          }
          return [];
        }),
      );
      setTokenAllowlistByChainId(tokenAllowlistResults);
    })();
  }, [allBridgeChains.length]);

  return tokenAllowlistByChainId;
};
