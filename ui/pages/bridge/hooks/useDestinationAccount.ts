import { useSelector } from 'react-redux';
import { useMemo, useState } from 'react';
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

  const defaultDestinationAccount = useMemo((): DestinationAccount | null => {
    if (!defaultInternalDestinationAccount) {
      return null;
    }
    return {
      ...defaultInternalDestinationAccount,
      walletName: walletName ?? '',
      isExternal: false,
      displayName: displayName ?? '',
    };
  }, [defaultInternalDestinationAccount, displayName, walletName]);

  const defaultAccountKey = `${defaultDestinationAccount?.address ?? ''}|${
    defaultDestinationAccount?.displayName ?? ''
  }|${defaultDestinationAccount?.walletName ?? ''}`;

  const [accountOverride, setAccountOverride] = useState<
    DestinationAccount | null | undefined
  >(undefined);
  const [overrideForKey, setOverrideForKey] = useState(defaultAccountKey);
  const [pickerOpenOverride, setPickerOpenOverride] = useState<
    boolean | undefined
  >(undefined);
  const [pickerOverrideForKey, setPickerOverrideForKey] =
    useState(defaultAccountKey);

  const selectedDestinationAccount =
    overrideForKey === defaultAccountKey && accountOverride !== undefined
      ? accountOverride
      : defaultDestinationAccount;

  const isDestinationAccountPickerOpen =
    pickerOverrideForKey === defaultAccountKey &&
    pickerOpenOverride !== undefined
      ? pickerOpenOverride
      : !defaultDestinationAccount;

  const setSelectedDestinationAccount = (
    account: DestinationAccount | null,
  ) => {
    setOverrideForKey(defaultAccountKey);
    setAccountOverride(account);
  };

  const setIsDestinationAccountPickerOpen = (isOpen: boolean) => {
    setPickerOverrideForKey(defaultAccountKey);
    setPickerOpenOverride(isOpen);
  };

  return {
    selectedDestinationAccount,
    setSelectedDestinationAccount,
    isDestinationAccountPickerOpen,
    setIsDestinationAccountPickerOpen,
  };
};
