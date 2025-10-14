import { useSelector } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import {
  formatChainIdToCaip,
  isSolanaChainId,
  isBitcoinChainId,
} from '@metamask/bridge-controller';
import {
  getAccountGroupNameByInternalAccount,
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
  const previousChainIdRef = useRef<string | undefined>(undefined);

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

  useEffect(() => {
    const currentChainId = toChain?.chainId;
    const previousChainId = previousChainIdRef.current;

    // Check if current and previous chains are non-EVM
    const isPreviousNonEvm =
      previousChainId &&
      (isSolanaChainId(previousChainId) || isBitcoinChainId(previousChainId));
    const isCurrentNonEvm =
      currentChainId &&
      (isSolanaChainId(currentChainId) || isBitcoinChainId(currentChainId));

    // Check if previous chain was EVM (not non-EVM and exists)
    const wasPreviousEvm = previousChainId && !isPreviousNonEvm;
    // Check if current chain is EVM (not non-EVM and exists)
    const isCurrentEvm = currentChainId && !isCurrentNonEvm;

    // Open account picker when bridging between non-EVM and EVM chains
    // Cases: non-EVM -> EVM, EVM -> non-EVM, or switching between different non-EVM chains
    const shouldOpenPicker =
      (isPreviousNonEvm && isCurrentEvm) || // non-EVM -> EVM
      (wasPreviousEvm && isCurrentNonEvm) || // EVM -> non-EVM
      (isPreviousNonEvm &&
        isCurrentNonEvm &&
        previousChainId !== currentChainId); // different non-EVM chains

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

    // Update the ref for next comparison
    previousChainIdRef.current = currentChainId;
  }, [defaultInternalDestinationAccount, displayName, toChain?.chainId]);

  return {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  };
};
