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
  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  onSelectSrp,
  selectedKeyringId,
  ///: END:ONLY_INCLUDE_IF(multi-srp)
}) => {
  const dispatch = useDispatch();

  const onCreateAccount = async (name) => {
    const newAccountAddress = await dispatch(
      addNewAccount(
        ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
        selectedKeyringId,
        ///: END:ONLY_INCLUDE_IF(multi-srp)
      ),
    );
    if (name) {
      dispatch(setAccountLabel(newAccountAddress, name));
    }
    onActionComplete(true);
  };

  const getNextAvailableAccountName = async () => {
    return await getNextAvailableAccountNameFromController({
      keyringType: KeyringTypes.hd,
    });
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
