import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAllBridgeableNetworks } from '../../ducks/bridge/selectors';
import { fetchBridgeTokens } from '../../pages/bridge/bridge.util';

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
      const tokenAllowlistResults = results.reduce(
        (acc, { value }) => ({ ...acc, ...value }),
        {},
      );
      setTokenAllowlistByChainId(tokenAllowlistResults);
    })();
  }, [allBridgeChains.length]);

  return tokenAllowlistByChainId;
};
