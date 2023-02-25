import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FormField from '../../../components/ui/form-field';
import {
  FormTextField,
  TEXT_FIELD_TYPES,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import BottomButtons from './bottom-buttons';

PrivateKeyImportView.propTypes = {
  importAccountFunc: PropTypes.func.isRequired,
};

export default function PrivateKeyImportView({ importAccountFunc }) {
  const t = useI18nContext();
  const [privateKey, setPrivateKey] = useState('');

  const warning = useSelector((state) => state.appState.warning);

  function handleKeyPress(event) {
    if (privateKey !== '' && event.key === 'Enter') {
      event.preventDefault();
      _importAccountFunc();
    }
  }

  function _importAccountFunc() {
    importAccountFunc('Private Key', [privateKey]);
  }

  return (
    <>
      <FormTextField
        id="private-key-box"
        autoFocus
        type={TEXT_FIELD_TYPES.PASSWORD}
        helpText={warning}
        helpTextProps={{ error: true }} // TODO: change to severity={SEVERITIES.ERROR} after rebase
        label={t('pastePrivateKey')}
        value={privateKey}
        onChange={setPrivateKey}
        inputProps={{
          onKeyPress: handleKeyPress,
        }}
        marginBottom={8}
      />
      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={privateKey === ''}
        marginTop={warning ? 0 : 6}
      />
    </>
  );
}
