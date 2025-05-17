import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  addNewAccount,
  setAccountLabel,
  getNextAvailableAccountName as getNextAvailableAccountNameFromController,
} from '../../../store/actions';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { CreateAccount } from '../create-account';

export const CreateEthAccount = ({
  onActionComplete,
  onSelectSrp,
  selectedKeyringId,
}) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name) => {
    trace({ name: TraceName.AddAccount });
    const newAccountAddress = await dispatch(addNewAccount(selectedKeyringId));
    if (name) {
      dispatch(setAccountLabel(newAccountAddress, name));
    }
    onActionComplete(true);
    endTrace({ name: TraceName.AddAccount });
  };

  const getNextAvailableAccountName = async () => {
    return await getNextAvailableAccountNameFromController(KeyringTypes.hd);
  };

  return (
    <CreateAccount
      onActionComplete={onActionComplete}
      onCreateAccount={onCreateAccount}
      getNextAvailableAccountName={getNextAvailableAccountName}
      ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
      onSelectSrp={onSelectSrp}
      selectedKeyringId={selectedKeyringId}
      ///: END:ONLY_INCLUDE_IF(multi-srp)
    ></CreateAccount>
  );
};

CreateEthAccount.propTypes = {
  /**
   * Executes when the Create button is clicked
   */
  onActionComplete: PropTypes.func.isRequired,
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  /**
   * Callback to select the SRP
   */
  onSelectSrp: PropTypes.func,
  /**
   * Currently selected HD keyring
   */
  selectedKeyringId: PropTypes.string,
  ///: END:ONLY_INCLUDE_IF(multi-srp)
};
