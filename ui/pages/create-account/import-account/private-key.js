import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import FormField from '../../../components/ui/form-field';
import { useI18nContext } from '../../../hooks/useI18nContext';
import BottomButtons from './bottom-buttons';

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
      <FormField
        id="private-key-box"
        autoFocus
        password
        error={warning}
        titleText={t('pastePrivateKey')}
        value={privateKey}
        onChange={setPrivateKey}
        inputProps={{
          onKeyPress: handleKeyPress,
        }}
      />
      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={privateKey === ''}
      />
    </>
  );
}
