import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import { isScopeEqualToAny } from '@metamask/keyring-utils';
import { getMetaMaskAccountsOrdered } from '../../selectors';

type UseAccountNetworkAvailabilityReturn = {
  hasAnyAccountsInNetwork: (chainId: CaipChainId) => boolean;
};

export const useAccountNetworkAvailability =
  (): UseAccountNetworkAvailabilityReturn => {
    const accounts = useSelector(getMetaMaskAccountsOrdered);

    const hasAnyAccountsInNetwork = useCallback(
      (chainId: CaipChainId) => {
        return accounts.some(({ scopes }: { scopes: CaipChainId[] }) =>
          isScopeEqualToAny(chainId, scopes),
        );
      },
      [accounts],
    );

    return { hasAnyAccountsInNetwork };
  };
