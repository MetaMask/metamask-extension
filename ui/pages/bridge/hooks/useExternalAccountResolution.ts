import { useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Hex, isValidHexAddress } from '@metamask/utils';
import {
  getDomainResolutions,
  initializeDomainSlice,
  lookupDomainName,
} from '../../../ducks/domains';
import { isSolanaAddress } from '../../../../shared/lib/multichain/accounts';
import { getInternalAccountByAddress } from '../../../selectors/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';

type UseExternalAccountResolutionProps = {
  searchQuery: string;
  isDestinationSolana: boolean;
};

export const useExternalAccountResolution = ({
  searchQuery,
  isDestinationSolana,
}: UseExternalAccountResolutionProps) => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const domainResolutionsFromStore = useSelector(getDomainResolutions);

  const trimmedQuery = searchQuery.trim();
  const validAddress = useMemo(() => {
    if (!trimmedQuery) {
      return null;
    }
    if (
      isDestinationSolana
        ? isSolanaAddress(trimmedQuery)
        : isValidHexAddress(trimmedQuery as Hex)
    ) {
      return trimmedQuery;
    }
    return null;
  }, [trimmedQuery, isDestinationSolana]);

  const validEnsName =
    !isDestinationSolana && trimmedQuery.endsWith('.eth') ? trimmedQuery : null;

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

    const externalAccount = {
      address: resolvedAddress,
      isExternal: true,
      type: 'eip155:eoa' as const,
      displayName: validEnsName ?? t('externalAccount'),
    };

    return externalAccount;
  }, [validEnsName, resolvedAddress, internalAccount]);
};
