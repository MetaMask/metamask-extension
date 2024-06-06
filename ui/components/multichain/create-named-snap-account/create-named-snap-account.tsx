import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { InternalAccount } from '@metamask/keyring-api';
import {
  addNewAccount,
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
  setAccountLabel,
} from '../../../store/actions';
import { CreateAccount } from '..';
import { getAccountById } from '../../../selectors';

type CreateNamedSnapAccountProps = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;

  /**
   * Account ID
   */
  accountId?: string;

  /**
   * Suggested account name from the snap
   */
  snapSuggestedAccountName?: string;
};

export const CreateNamedSnapAccount: React.FC<CreateNamedSnapAccountProps> = ({
  onActionComplete,
  accountId,
  snapSuggestedAccountName,
}) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name: string) => {
    console.log(`[CreateNamedSnapAccount] onCreateAccount name: ${name}`);
    const newAccountAddress =
      (useSelector(getAccountById(accountId)) as InternalAccount).address ||
      dispatch(addNewAccount());
    console.log(
      `[CreateNamedSnapAccount] onCreateAccount newAccountAddress: ${newAccountAddress}`,
    );
    if (newAccountAddress) {
      dispatch(setAccountLabel(newAccountAddress, name));
      await onActionComplete(true);
    } else {
      console.error(
        'Failed to create new account or invalid account address type.',
      );
      await onActionComplete(false);
    }
  };

  const getNextAccountName = async (): Promise<string> => {
    const defaultAccountName =
      await getNextAvailableAccountNameFromController();
    console.log(
      `[CreateNamedSnapAccount] getNextAccountName snapSuggestedAccountName: ${snapSuggestedAccountName}`,
    );
    return snapSuggestedAccountName || defaultAccountName;
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAccountName}
    />
  );
};
