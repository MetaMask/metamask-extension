import React from 'react';
import { useDispatch } from 'react-redux';
import {
  addNewAccount,
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
  setAccountLabel,
} from '../../../store/actions';
import { CreateAccount } from '..';

type CreateSnapAccountProps = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete?: (completed: boolean) => Promise<void>;

  /**
   * Suggested account name from the snap
   */
  snapSuggestedAccountName?: string;
};

export const CreateSnapAccount: React.FC<CreateSnapAccountProps> = ({
  onActionComplete,
  snapSuggestedAccountName,
}) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name: string) => {
    const newAccountAddress = dispatch(addNewAccount()) as unknown as string;
    if (newAccountAddress) {
      dispatch(setAccountLabel(newAccountAddress, name));
      if (onActionComplete) {
        await onActionComplete(true);
      }
    } else {
      console.error(
        'Failed to create new account or invalid account address type.',
      );
      if (onActionComplete) {
        await onActionComplete(false);
      }
    }
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
