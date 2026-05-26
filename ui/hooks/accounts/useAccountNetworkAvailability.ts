import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import { getMetaMaskAccountsOrdered } from '../../selectors';

type UseAccountNetworkAvailabilityReturn = {
  hasAnyAccountsInNetwork: (chainId: CaipChainId) => boolean;
};

export const useAccountNetworkAvailability =
  (): UseAccountNetworkAvailabilityReturn => {
    const accounts = useSelector(getMetaMaskAccountsOrdered);

    const hasAnyAccountsInNetwork = useCallback((chainId: CaipChainId) => {
      return accounts.some(({ scopes }: { scopes: CaipChainId[] }) =>
        scopes.includes(chainId),
      );
    }, [accounts]);

    return { hasAnyAccountsInNetwork };
  };
