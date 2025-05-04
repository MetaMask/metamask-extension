import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  type WellKnownChain,
  getWellKnownChains,
} from '../../../../../shared/modules/well-known-chains';
import { useExternalWellKnownChainsValidationSelector } from '../../../../selectors';

export type { WellKnownChain } from '../../../../../shared/modules/well-known-chains';

export const useWellKnownChains = () => {
  const useWellKnownChainsValidation = useSelector(
    useExternalWellKnownChainsValidationSelector,
  );

  const [wellKnownChains, setWellKnownChains] = useState<{
    wellKnownChains?: WellKnownChain[];
    error?: Error;
  }>({ wellKnownChains: [] });

  useEffect(() => {
    async function fetchWellKnownChains() {
      try {
        setWellKnownChains({
          wellKnownChains: await getWellKnownChains(
            useWellKnownChainsValidation,
          ),
        });
      } catch (error) {
        if (error instanceof Error) {
          setWellKnownChains({ error });
        }
      }
    }
    fetchWellKnownChains();
  }, [useWellKnownChainsValidation]);

  return wellKnownChains;
};

export const rpcIdentifierUtility = (
  rpcUrl: string,
  wellKnownChains: WellKnownChain[],
) => {
  const { host } = new URL(rpcUrl);

  for (const chain of wellKnownChains) {
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
