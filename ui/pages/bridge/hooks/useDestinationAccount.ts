import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  getAccountGroupNameByInternalAccount,
  getIsToOrFromNonEvm,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import type { DestinationAccount } from '../prepare/types';

/**
 * Hook to provide the default internal destination account for a bridge quote, and the state for the destination account picker modal
 *
 * @returns The default destination account and its setter, and the state for the
 * destination account picker modal and its setter.
 */
export const useDestinationAccount = () => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);
  const [isDestinationAccountPickerOpen, setIsDestinationAccountPickerOpen] =
    useState(false);
  const toChain = useSelector(getToChain);

  // For bridges, use the appropriate account type for the destination chain
  const defaultInternalDestinationAccount = useSelector((state) =>
    toChain?.chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          formatChainIdToCaip(toChain.chainId),
        )
      : null,
  );

  const displayName = useSelector((state) =>
    getAccountGroupNameByInternalAccount(
      state,
      defaultInternalDestinationAccount,
    ),
  );

  const isToOrFromNonEvm = useSelector(getIsToOrFromNonEvm);

  useEffect(() => {
    // Open account picker when bridging between non-EVM and EVM chains and there is no matching account (edge case)
    // Cases: non-EVM -> EVM, EVM -> non-EVM, or switching between different non-EVM chains
    const shouldOpenPicker =
      !defaultInternalDestinationAccount && isToOrFromNonEvm;

    if (shouldOpenPicker) {
      setSelectedDestinationAccount(null);
      setIsDestinationAccountPickerOpen(true);
    } else {
      setSelectedDestinationAccount(
        defaultInternalDestinationAccount
          ? {
              ...defaultInternalDestinationAccount,
              isExternal: false,
              displayName: displayName ?? '',
            }
          : null,
      );
    }
  }, [defaultInternalDestinationAccount, isToOrFromNonEvm, displayName]);

  return {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  };
};
