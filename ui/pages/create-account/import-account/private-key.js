import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { SEVERITIES } from '../../../helpers/constants/design-system';
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

  function handleOnChange(event) {
    setPrivateKey(event.target.value);
  }

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
        helpTextProps={{ severity: SEVERITIES.DANGER }}
        label={t('pastePrivateKey')}
        value={privateKey}
        onChange={handleOnChange}
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
