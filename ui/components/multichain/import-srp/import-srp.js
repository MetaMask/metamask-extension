import PropTypes from 'prop-types';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import SrpInput from '../../app/srp-input';
import BottomButtons from '../import-account/bottom-buttons';
import * as actions from '../../../store/actions';

export default function SRPImportView({ onActionComplete }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = React.useState('');
  const warning = useSelector((state) => state.appState.warning);

  async function _importAccountFunc() {
    if (secretRecoveryPhrase.trim()) {
      await dispatch(
        actions.createNewVaultAndRestoreFromMnemonic(
          secretRecoveryPhrase.trim(),
        ),
      );
    }
  }

  return (
    <>
      <SrpInput
        srpText={t('pasteSecretRecoveryPhrase')}
        onChange={(value) => setSecretRecoveryPhrase(value)}
        error={warning}
      />

      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={!secretRecoveryPhrase.trim()}
        onActionComplete={onActionComplete}
      />
    </>
  );
}

SRPImportView.propTypes = {
  /**
   * Executes when the key is imported
   */
  onActionComplete: PropTypes.func.isRequired,
};
