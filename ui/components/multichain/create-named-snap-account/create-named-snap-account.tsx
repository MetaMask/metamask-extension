import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { CreateAccount } from '..';
import { Box, ModalHeader } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getNextAvailableAccountName } from '../../../store/actions';
import { getUniqueAccountName } from '../../../../shared/lib/accounts';

export type CreateNamedSnapAccountProps = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (
    completed: { success: boolean; name?: string },
    reject?: boolean,
  ) => Promise<void>;

  /**
   * Suggested account name from the snap
   */
  snapSuggestedAccountName?: string;
};

export const CreateNamedSnapAccount: React.FC<CreateNamedSnapAccountProps> = ({
  onActionComplete,
  snapSuggestedAccountName,
}) => {
  const t = useI18nContext();
  const history = useHistory();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const rejectAction = useCallback(async (completed: boolean) => {
    await onActionComplete({ success: completed });
  }, []);

  const onCreateAccount = useCallback(async (name?: string) => {
    await onActionComplete({ success: true, name });
  }, []);

  const getNextAccountName = useCallback(
    async (accounts: InternalAccount[]): Promise<string> => {
      // If a snap-suggested account name exists, use it as a base
      return snapSuggestedAccountName
        ? getUniqueAccountName(accounts, snapSuggestedAccountName)
        : getNextAvailableAccountName(KeyringTypes.snap);
    },
    [],
  );

  const onClose = useCallback(async () => {
    await onActionComplete({ success: false });
    history.push(mostRecentOverviewPage);
  }, []);

  return (
    <Box padding={6} className="name-snap-account-page">
      <ModalHeader
        paddingTop={2}
        paddingBottom={4}
        paddingRight={0}
        paddingLeft={0}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClose={onClose}
      >
        {t('addAccountToMetaMask')}
      </ModalHeader>
      <CreateAccount
        // onActionComplete is called when a user rejects the action
        // onCreateAccount will call onActionComplete if a user confirms the action
        onActionComplete={rejectAction}
        onCreateAccount={onCreateAccount}
        getNextAvailableAccountName={getNextAccountName}
      />
    </Box>
  );
};
