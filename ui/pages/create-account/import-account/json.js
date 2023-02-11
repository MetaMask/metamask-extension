import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FileInput from 'react-simple-file-input';
import { ButtonLink, Text } from '../../../components/component-library';
import FormField from '../../../components/ui/form-field';
import {
  Size,
  TextVariant,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { displayWarning } from '../../../store/actions';
import BottomButtons from './bottom-buttons';
import { moreInfoLink } from '.';

JsonImportSubview.propTypes = {
  importAccountFunc: PropTypes.func.isRequired,
};

export default function JsonImportSubview({ importAccountFunc }) {
  const t = useI18nContext();
  const warning = useSelector((state) => state.appState.warning);
  const [password, setPassword] = useState('');
  const [fileContents, setFileContents] = useState('');

  const isPrimaryDisabled = password === '' || fileContents === '';

  function handleKeyPress(event) {
    if (!isPrimaryDisabled && event.key === 'Enter') {
      event.preventDefault();
      _importAccountFunc();
    }
  }

  function _importAccountFunc() {
    if (isPrimaryDisabled) {
      displayWarning(t('needImportFile'));
    } else {
      importAccountFunc('JSON File', [fileContents, password]);
    }
  }

  return (
    <>
      <Text variant={TextVariant.bodyMd} textAlign={TEXT_ALIGN.CENTER}>
        {t('usedByClients')}
        <ButtonLink size={Size.inherit} onClick={moreInfoLink}>
          {t('fileImportFail')}
        </ButtonLink>
      </Text>

      <FileInput
        readAs="text"
        onLoad={(event) => setFileContents(event.target.result)}
        style={{
          padding: '20px 0px 12px 15%',
          fontSize: '15px',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      />

      <FormField
        autoFocus
        password
        error={warning}
        placeholder={t('enterPassword')}
        id="json-password-box"
        value={password}
        onChange={setPassword}
        inputProps={{
          onKeyPress: handleKeyPress,
        }}
      />

      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={isPrimaryDisabled}
      />
    </>
  );
}
