import { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// eslint-disable-next-line import/no-restricted-paths
import { isEthAddress } from '../../../../app/scripts/lib/multichain/address';
import type { ExternalDestinationAccount } from '../prepare/types';
import {
  getDomainResolutions,
  initializeDomainSlice,
  lookupDomainName,
} from '../../../ducks/domains';
import {
  isSolanaAddress,
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../../../shared/lib/multichain/accounts';
import { getInternalAccountByAddress } from '../../../selectors/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';

type UseExternalAccountResolutionProps = {
  searchQuery: string;
  isDestinationSolana: boolean;
  isDestinationBitcoin?: boolean;
};

export const useExternalAccountResolution = ({
  searchQuery,
  isDestinationSolana,
  isDestinationBitcoin = false,
}: UseExternalAccountResolutionProps): ExternalDestinationAccount | null => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const domainResolutionsFromStore = useSelector(getDomainResolutions);

  const trimmedQuery = searchQuery.trim();
  const validAddress = useMemo(() => {
    if (!trimmedQuery) {
      return null;
    }
    // Check for Bitcoin addresses
    if (isDestinationBitcoin) {
      if (
        isBtcMainnetAddress(trimmedQuery) ||
        isBtcTestnetAddress(trimmedQuery)
      ) {
        return trimmedQuery;
      }
      return null;
    }

    // Check for Solana addresses
    if (isDestinationSolana) {
      if (isSolanaAddress(trimmedQuery)) {
        return trimmedQuery;
      }
      return null;
    }

    // Default to checking for Ethereum addresses
    if (isEthAddress(trimmedQuery)) {
      return trimmedQuery;
    }

    return null;
  }, [trimmedQuery, isDestinationSolana, isDestinationBitcoin]);

  const validEnsName =
    !isDestinationSolana &&
    !isDestinationBitcoin &&
    trimmedQuery.endsWith('.eth')
      ? trimmedQuery
      : null;

  // Lookup ENS name when we detect a valid ENS name
  useEffect(() => {
    if (validEnsName) {
      dispatch(initializeDomainSlice());
      dispatch(lookupDomainName(validEnsName));
    }
  }, [validEnsName]);

  const resolvedAddress =
    validAddress ?? domainResolutionsFromStore?.[0]?.resolvedAddress;

  const internalAccount = useSelector((state) =>
    getInternalAccountByAddress(state, resolvedAddress),
  );

  // Build an external account object if resolved address is not an internal account
  return useMemo(() => {
    if (!resolvedAddress || internalAccount) {
      return null;
    }
    return {
      address: resolvedAddress,
      isExternal: true,
      type: 'any:account' as const,
      displayName: validEnsName ?? t('externalAccount'),
    };
  }, [validEnsName, resolvedAddress, internalAccount]);
};
