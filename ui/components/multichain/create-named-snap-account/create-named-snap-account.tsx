import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { CreateAccount, CreateBtcAccount } from '..';
import { Box, ModalHeader } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../../../shared/lib/multichain';
import { getNextAvailableAccountName } from '../../../store/actions';

export type CreateNamedSnapAccountProps = {
  /**
   * Callback called once the account has been created
   */
  onActionComplete: (
    completed: { success: boolean; name?: string },
    reject?: boolean,
  ) => Promise<void>;

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

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const isBtcAccount = useMemo(
    () => isBtcMainnetAddress(address) || isBtcTestnetAddress(address),
    [address],
  );

  const rejectAction = useCallback(async (completed: boolean) => {
    await onActionComplete({ success: completed });
  }, []);

  const onCreateAccount = useCallback(async (name?: string) => {
    await onActionComplete({ success: true, name });
  }, []);

  const getNextAccountName = useCallback(
    async (_accounts: InternalAccount[]): Promise<string> => {
      // if snapSuggestedAccountName exists, return it immediately
      if (snapSuggestedAccountName) {
        return snapSuggestedAccountName;
      }

      const nextAccountName = await getNextAvailableAccountName(
        KeyringTypes.snap,
      );

      return nextAccountName;
    },
    [],
  );

  const onClose = useCallback(async () => {
    await onActionComplete({ success: false });
    history.push(mostRecentOverviewPage);
  }, []);

  return (
    <Box padding={4}>
      <ModalHeader padding={4} onClose={onClose}>
        {t('addAccountToMetaMask')}
      </ModalHeader>
      {isBtcAccount ? (
        <CreateBtcAccount
          // onActionComplete is called when a user rejects the action
          onActionComplete={rejectAction}
          onCreateAccount={onCreateAccount}
          address={address}
        />
      ) : (
        <CreateAccount
          // onActionComplete is called when a user rejects the action
          onActionComplete={rejectAction}
          onCreateAccount={onCreateAccount}
          getNextAvailableAccountName={getNextAccountName}
        />
      )}
    </Box>
  );
};
