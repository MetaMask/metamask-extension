import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  addNewAccount,
  setAccountLabel,
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
} from '../../../store/actions';
import { CreateAccount } from '../create-account';

export const CreateEthAccount = ({
  onActionComplete,
  onSelectSrp,
  selectedKeyringId,
  redirectToOverview,
}) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name) => {
    const newAccount = await dispatch(addNewAccount(selectedKeyringId));
    if (name) {
      dispatch(setAccountLabel(newAccount.address, name));
    }
    onActionComplete(true, newAccount);
  };

  const getNextAvailableAccountName = async () => {
    return await getNextAvailableAccountNameFromController(KeyringTypes.hd);
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAvailableAccountName}
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
      redirectToOverview={redirectToOverview}
    ></CreateAccount>
  );
};

CreateEthAccount.propTypes = {
  /**
   * Executes when the Create button is clicked
   */
  onActionComplete: PropTypes.func.isRequired,
  /**
   * Callback to select the SRP
   */
  onSelectSrp: PropTypes.func,
  /**
   * Currently selected HD keyring
   */
  selectedKeyringId: PropTypes.string,
  /**
   * Whether to redirect to the overview page after creating the account
   */
  redirectToOverview: PropTypes.bool,
};
