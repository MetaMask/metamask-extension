import React from 'react';
import { useDispatch } from 'react-redux';
import {
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
  setAccountLabel,
} from '../../../store/actions';
import { CreateAccount } from '..';

export type CreateNamedSnapAccountProps = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean) => Promise<void>;

  /**
   * Address of the account to create
   */
  address: string;

  /**
   * Suggested account name from the snap
   */
  snapSuggestedAccountName?: string;
};

export const CreateNamedSnapAccount: React.FC<CreateNamedSnapAccountProps> = ({
  onActionComplete,
  address,
  snapSuggestedAccountName,
}) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name: string) => {
    dispatch(setAccountLabel(address, name));
    await onActionComplete(true);
  };

  const getNextAccountName = async (): Promise<string> => {
    const defaultAccountName =
      await getNextAvailableAccountNameFromController();
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
