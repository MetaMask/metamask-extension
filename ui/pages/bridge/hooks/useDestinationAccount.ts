import { useSelector } from 'react-redux';
import {
  getSelectedInternalAccount,
  getSelectedEvmInternalAccount,
} from '../../../selectors';
import { useEffect, useState } from 'react';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { getToChain } from '../../../ducks/bridge/selectors';
import {
  getLastSelectedSolanaAccount,
  getMultichainIsEvm,
} from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { formatChainIdToCaip } from '../../../../shared/modules/bridge-utils/caip-formatters';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

export const useDestinationAccount = (isSwap = false) => {
  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<InternalAccount | null>(null);

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
  const isDestinationSolana =
    toChain &&
    formatChainIdToCaip(toChain.chainId) === MultichainNetworks.SOLANA;

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
