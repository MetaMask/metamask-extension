import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
  setAccountLabel,
} from '../../../store/actions';
import { CreateAccount } from '..';
import { Box, ModalHeader } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getSnapRoute } from '../../../helpers/utils/util';

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
   * Snap Id
   */
  snapId: string;

  /**
   * Suggested account name from the snap
   */
  snapSuggestedAccountName?: string;
};

export const CreateNamedSnapAccount: React.FC<CreateNamedSnapAccountProps> = ({
  onActionComplete,
  address,
  snapId,
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

  const getNextAccountName = async (): Promise<string> => {
    const defaultAccountName =
      await getNextAvailableAccountNameFromController();
    return snapSuggestedAccountName || defaultAccountName;
  };

  const onClose = async () => {
    await onActionComplete(false);
    history.push(mostRecentOverviewPage);
  };

  // TODO: Implement back button to go back to snap
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onBack = async () => {
    history.push(getSnapRoute(snapId));
    await onActionComplete(false);
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
