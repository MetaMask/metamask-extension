import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { isSolanaChainId } from '@metamask/bridge-controller';
import {
  getSelectedEvmInternalAccount,
  getSelectedInternalAccount,
} from '../../../selectors';
import { getToChain, getFromChain } from '../../../ducks/bridge/selectors';
import { getLastSelectedSolanaAccount } from '../../../selectors/multichain';
import type { DestinationAccount } from '../prepare/types';

export const useDestinationAccount = () => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);

  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  const currentlySelectedAccount = useSelector(getSelectedInternalAccount);

  const fromChain = useSelector(getFromChain);
  const toChain = useSelector(getToChain);
  const isDestinationSolana = toChain && isSolanaChainId(toChain.chainId);

  // Auto-select most recently used account when toChain or account changes
  useEffect(() => {
    if (!toChain) {
      // If no destination chain selected, clear the destination account
      setSelectedDestinationAccount(null);
      return;
    }

    // Check if it's a swap (same chain)
    const isSwap = fromChain?.chainId === toChain?.chainId;

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
    fromChain,
    currentlySelectedAccount,
  ]);

  return { selectedDestinationAccount, setSelectedDestinationAccount };
};
