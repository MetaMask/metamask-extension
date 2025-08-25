import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { isSolanaChainId } from '@metamask/bridge-controller';
import {
  getSelectedEvmInternalAccount,
  getSelectedInternalAccount,
} from '../../../selectors';
import { getToChain } from '../../../ducks/bridge/selectors';
import { getLastSelectedSolanaAccount } from '../../../selectors/multichain';
import type { DestinationAccount } from '../prepare/types';

export const useDestinationAccount = (isSwap: boolean) => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);

  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  const currentlySelectedAccount = useSelector(getSelectedInternalAccount);

  const toChain = useSelector(getToChain);
  const isDestinationSolana = toChain && isSolanaChainId(toChain.chainId);

  // Auto-select most recently used account when toChain or account changes
  useEffect(() => {
    if (!toChain) {
      // If no destination chain selected, clear the destination account
      setSelectedDestinationAccount(null);
      return;
    }

    // Use isSwap parameter to determine behavior
    // This preserves legacy behavior when unified UI is disabled
    if (isSwap) {
      // For swaps, always use the currently selected account
      setSelectedDestinationAccount(currentlySelectedAccount);
    } else {
      // For bridges, use the appropriate account type for the destination chain
      setSelectedDestinationAccount(
        isDestinationSolana ? selectedSolanaAccount : selectedEvmAccount,
      );
    }
  }, [
    isDestinationSolana,
    selectedSolanaAccount,
    selectedEvmAccount,
    toChain,
    currentlySelectedAccount,
    isSwap,
  ]);

  return { selectedDestinationAccount, setSelectedDestinationAccount };
};
