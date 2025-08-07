import { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { InternalAccount } from '@metamask/keyring-internal-api';
// eslint-disable-next-line import/no-restricted-paths
import { isEthAddress } from '../../../../app/scripts/lib/multichain/address';
import {
  getDomainResolutions,
  lookupDomainName,
  resetDomainResolution,
  initializeDomainSlice,
} from '../../../ducks/domains';
import { isSolanaAddress } from '../../../../shared/lib/multichain/accounts';
import { type BridgeDestinationAccount } from '../../../ducks/bridge/types';

type UseExternalAccountResolutionProps = {
  searchQuery: string;
  isDestinationSolana: boolean;
  accounts: InternalAccount[];
};

type UseExternalAccountResolutionResult = {
  isValidAddress: boolean;
  isValidEnsName: boolean;
  externalAccount: BridgeDestinationAccount | null;
};

export const useExternalAccountResolution = ({
  searchQuery,
  isDestinationSolana,
  accounts,
}: UseExternalAccountResolutionProps): UseExternalAccountResolutionResult => {
  const dispatch = useDispatch();
  const domainResolutionsFromStore = useSelector(getDomainResolutions);

  // Initialize domain slice on mount
  useEffect(() => {
    dispatch(initializeDomainSlice());
  }, [dispatch]);

  // Check if search query is a valid address
  const isValidAddress = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return false;
    }

    return isDestinationSolana
      ? isSolanaAddress(trimmedQuery)
      : isEthAddress(trimmedQuery);
  }, [searchQuery, isDestinationSolana]);

  // Check if search query is a valid ENS name
  const isValidEnsName = useMemo(() => {
    if (isDestinationSolana) {
      return false;
    }
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return false;
    }
    return trimmedQuery.endsWith('.eth');
  }, [searchQuery, isDestinationSolana]);

  // Lookup ENS name when we detect a valid ENS name
  useEffect(() => {
    if (isValidEnsName) {
      dispatch(lookupDomainName(searchQuery.trim()));
    } else {
      dispatch(resetDomainResolution());
    }
  }, [dispatch, isValidEnsName, searchQuery]);

  // Create an external account object if valid address is not in internal accounts
  const externalAccount = useMemo(() => {
    const domainResolutions = domainResolutionsFromStore || [];

    if (!isValidAddress && !isValidEnsName) {
      return null;
    }

    // If it's a valid ENS name and we have resolutions, use the resolved address
    if (isValidEnsName && domainResolutions.length > 0) {
      const { resolvedAddress } = domainResolutions[0];
      const ensName = searchQuery.trim();

      const addressExists = accounts.some(
        (account) =>
          account.address.toLowerCase() === resolvedAddress.toLowerCase(),
      );

      if (addressExists) {
        return null;
      }

      return {
        address: resolvedAddress,
        metadata: {
          name: ensName,
        },
        type: 'eip155:eoa' as const,
        isExternal: true,
      };
    }

    // For regular addresses
    if (isValidAddress) {
      const address = searchQuery.trim();
      const matchedAccount = accounts.find(
        (account) => account.address.toLowerCase() === address.toLowerCase(),
      );

      if (matchedAccount) {
        return null;
      }

      return {
        address,
        metadata: {
          name: address,
        },
        type: 'any:account' as const,
        isExternal: true,
      };
    }

    return null;
  }, [
    accounts,
    isValidAddress,
    isValidEnsName,
    searchQuery,
    domainResolutionsFromStore,
  ]);

  return {
    isValidAddress,
    isValidEnsName,
    externalAccount,
  };
};
