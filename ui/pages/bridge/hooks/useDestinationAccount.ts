import { useSelector } from 'react-redux';
import { useState } from 'react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  getAccountGroupNameByInternalAccount,
  getToChain,
} from '../../../ducks/bridge/selectors';
import {
  getInternalAccountBySelectedAccountGroupAndCaip,
  getWalletIdAndNameByAccountAddress,
} from '../../../selectors/multichain-accounts/account-tree';
import type { DestinationAccount } from '../prepare/types';

/**
 * Hook to provide the default internal destination account for a bridge quote, and the state for the destination account picker modal
 *
 * @returns The default destination account and its setter, and the state for the
 * destination account picker modal and its setter.
 */
export const useDestinationAccount = () => {
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

  const walletName = useSelector((state) =>
    defaultInternalDestinationAccount?.address
      ? getWalletIdAndNameByAccountAddress(
          state,
          defaultInternalDestinationAccount?.address,
        )?.name
      : null,
  );

  const buildDestinationAccount = (): DestinationAccount | null =>
    defaultInternalDestinationAccount
      ? {
          ...defaultInternalDestinationAccount,
          walletName: walletName ?? '',
          isExternal: false,
          displayName: displayName ?? '',
        }
      : null;

  const [selectedDestinationAccount, setSelectedDestinationAccount] =
    useState<DestinationAccount | null>(buildDestinationAccount);
  const [isDestinationAccountPickerOpen, setIsDestinationAccountPickerOpen] =
    useState(() => !defaultInternalDestinationAccount);

  const [
    prevDefaultInternalDestinationAccount,
    setPrevDefaultInternalDestinationAccount,
  ] = useState(defaultInternalDestinationAccount);
  const [prevDisplayName, setPrevDisplayName] = useState(displayName);
  const [prevWalletName, setPrevWalletName] = useState(walletName);

  if (
    defaultInternalDestinationAccount !==
      prevDefaultInternalDestinationAccount ||
    displayName !== prevDisplayName ||
    walletName !== prevWalletName
  ) {
    setPrevDefaultInternalDestinationAccount(defaultInternalDestinationAccount);
    setPrevDisplayName(displayName);
    setPrevWalletName(walletName);
    setSelectedDestinationAccount(buildDestinationAccount());
    setIsDestinationAccountPickerOpen(!defaultInternalDestinationAccount);
  }

  return {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  };
};
