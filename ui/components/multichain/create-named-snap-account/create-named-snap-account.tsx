import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { KeyringTypes } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-api';
import {
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
  setAccountLabel,
} from '../../../store/actions';
import { CreateAccount } from '..';
import { Box, ModalHeader } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getAccountName } from '../../../selectors';

export type CreateNamedSnapAccountProps = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (completed: boolean, reject?: boolean) => Promise<void>;

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
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const onCreateAccount = async (name: string) => {
    dispatch(setAccountLabel(address, name));
    await onActionComplete(true);
  };

  const getNextAccountName = async (
    accounts: InternalAccount[],
  ): Promise<string> => {
    // Get the name of the temporary internal account
    let defaultAccountName: string = getAccountName(accounts, address);
    if (!defaultAccountName) {
      const nextAvailableName = await getNextAvailableAccountNameFromController(
        KeyringTypes.snap,
      );
      // Format is "Snap Account <number>"
      const parts = nextAvailableName.split(' ');
      const accountNumber = parseInt(parts[parts.length - 1], 10);
      if (isNaN(accountNumber)) {
        defaultAccountName = nextAvailableName;
      } else {
        parts[parts.length - 1] = (accountNumber - 1).toString();
        defaultAccountName = parts.join(' ');
      }
    }
    return snapSuggestedAccountName || defaultAccountName;
  };

  const onClose = async () => {
    await onActionComplete(false);
    history.push(mostRecentOverviewPage);
  };

  return (
    <Box padding={4}>
      <ModalHeader padding={4} onClose={onClose}>
        {t('addAccountToMetaMask')}
      </ModalHeader>
      <CreateAccount
        onActionComplete={onActionComplete}
        onCreateAccount={onCreateAccount}
        getNextAvailableAccountName={getNextAccountName}
      />
    </Box>
  );
};
