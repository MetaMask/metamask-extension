import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { isSolanaChainId } from '@metamask/bridge-controller';
import {
  getSelectedInternalAccount,
  getSelectedEvmInternalAccount,
} from '../../../selectors';
import { getToChain } from '../../../ducks/bridge/selectors';
import {
  getLastSelectedSolanaAccount,
  getMultichainIsEvm,
} from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import type { DestinationAccount } from '../prepare/types';

export const useDestinationAccount = (isSwap = false) => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(null);

  const isEvm = useMultichainSelector(getMultichainIsEvm);
  const selectedEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const selectedSolanaAccount = useSelector(getLastSelectedSolanaAccount);
  const selectedMultichainAccount = useMultichainSelector(
    getSelectedInternalAccount,
  );
  const selectedAccount = isEvm
    ? selectedEvmAccount
    : selectedMultichainAccount;

  const toChain = useSelector(getToChain);
  const isDestinationSolana = toChain && isSolanaChainId(toChain.chainId);

  // Auto-select most recently used account when toChain or account changes
  useEffect(() => {
    if (isSwap) {
      setSelectedDestinationAccount(selectedAccount);
      return;
    }

    setSelectedDestinationAccount(
      isDestinationSolana ? selectedSolanaAccount : selectedEvmAccount,
    );
  }, [isDestinationSolana, selectedSolanaAccount, selectedEvmAccount]);

  return { selectedDestinationAccount, setSelectedDestinationAccount };
};
