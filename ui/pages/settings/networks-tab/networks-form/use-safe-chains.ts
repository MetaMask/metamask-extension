import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSafeChainsListValidationSelector } from '../../../../selectors';
import {
  WellknownChain,
  getWellknownChains,
} from '../../../../../shared/lib/network-utils';

export const useSafeChains = () => {
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );

  const [safeChains, setSafeChains] = useState<{
    safeChains?: WellknownChain[];
    error?: Error;
  }>({ safeChains: [] });

  useEffect(() => {
    async function fetchSafeChains() {
      try {
        const _safeChains = await getWellknownChains();
        setSafeChains({ safeChains: _safeChains });
      } catch (error) {
        if (error instanceof Error) {
          setSafeChains({ error });
        }
      }
    }
    fetchSafeChains();
  }, [useSafeChainsListValidation]);

  return safeChains;
};

export const rpcIdentifierUtility = (
  rpcUrl: string,
  safeChains: WellknownChain[],
) => {
  const { host } = new URL(rpcUrl);

  for (const chain of safeChains) {
    for (const rpc of chain.rpc) {
      try {
        if (host === new URL(rpc).host) {
          return host;
        }
      } catch {
        continue;
      }
    }
  }

  return 'Unknown rpcUrl';
};
