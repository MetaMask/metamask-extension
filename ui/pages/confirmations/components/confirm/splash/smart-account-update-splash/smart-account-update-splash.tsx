import React from 'react';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { ORIGIN_METAMASK } from '../../../../../../../shared/constants/app';
import {
  AccountsState,
  getMemoizedInternalAccountByAddress,
} from '../../../../../../selectors';
import { isHardwareKeyring } from '../../../../../../helpers/utils/hardware';
import {
  getSmartAccountOptInForAccounts,
  getUseSmartAccount,
} from '../../../../selectors/preferences';
import { useConfirmContext } from '../../../../context/confirm';
import { useSmartAccountActions } from '../../../../hooks/useSmartAccountActions';
import { SmartAccountUpdate } from '../../smart-account-update';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdateSplash() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { handleRejectUpgrade } = useSmartAccountActions();
  const smartAccountOptIn = useSelector(getUseSmartAccount);
  const { txParams, origin } = currentConfirmation ?? {};
  const { from } = txParams;
  const smartAccountOptInForAccounts: Hex[] = useSelector(
    getSmartAccountOptInForAccounts,
  );
  const account = useSelector((state: AccountsState) =>
    getMemoizedInternalAccountByAddress(state as AccountsState, from),
  );
  const keyringType = account?.metadata?.keyring?.type;

  if (
    !currentConfirmation ||
    origin === ORIGIN_METAMASK ||
    smartAccountOptInForAccounts?.includes(from.toLowerCase() as Hex) ||
    (smartAccountOptIn && !isHardwareKeyring(keyringType))
  ) {
    return null;
  }

  return (
    <SmartAccountUpdate wrapped handleRejectUpgrade={handleRejectUpgrade} />
  );
}
