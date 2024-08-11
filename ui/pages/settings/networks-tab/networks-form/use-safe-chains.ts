import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useSafeChainsListValidationSelector } from '../../../../selectors';
import fetchWithCache from '../../../../../shared/lib/fetch-with-cache';

export const useSafeChains = () => {
  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );

  const [safeChains, setSafeChains] = useState<{
    safeChains?: {
      chainId: string;
      name: string;
      nativeCurrency: { symbol: string };
    }[];
    error?: any;
  }>({ safeChains: [{}] });

  if (useSafeChainsListValidation) {
    useEffect(() => {
      fetchWithCache({
        url: 'https://chainid.network/chains.json',
        functionName: 'getSafeChainsList',
      })
        .then((response) => {
          setSafeChains({ safeChains: response });
        })
        .catch((error) => {
          setSafeChains({ error });
        });
    }, []);
  }

  return safeChains;
};
