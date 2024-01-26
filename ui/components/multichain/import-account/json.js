import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FileInput from 'react-simple-file-input';
import {
  ButtonLink,
  TextFieldSize,
  TextFieldType,
  Text,
} from '../../component-library';
import {
  Size,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { displayWarning } from '../../../store/actions';
import BottomButtons from './bottom-buttons';

export default function JsonImportSubview({
  importAccountFunc,
  onActionComplete,
}) {
  const t = useI18nContext();
  const warning = useSelector((state) => state.appState.warning);
  const [password, setPassword] = useState('');
  const [fileContents, setFileContents] = useState('');

  const isPrimaryDisabled = fileContents === '';

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
      importAccountFunc('json', [fileContents, password]);
    }
  }

  return (
    <>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Center}>
        {t('usedByClients')}
        <ButtonLink
          size={Size.inherit}
          href={ZENDESK_URLS.IMPORTED_ACCOUNTS}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('fileImportFail')}
        </ButtonLink>
      </Text>

      <FileInput
        id="file-input"
        data-testid="file-input"
        readAs="text"
        onLoad={(event) => setFileContents(event.target.result)}
        style={{
          padding: '20px 0px 12px 15%',
          fontSize: '16px',
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
        }}
      />

      <FormTextField
        id="json-password-box"
        size={TextFieldSize.Lg}
        autoFocus
        type={TextFieldType.Password}
        helpText={warning}
        error
        placeholder={t('enterOptionalPassword')}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
        }}
        inputProps={{
          onKeyPress: handleKeyPress,
        }}
        marginBottom={4}
      />

      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={isPrimaryDisabled}
        onActionComplete={onActionComplete}
      />
    </>
  );
}

JsonImportSubview.propTypes = {
  /**
   * Function to import the account
   */
  importAccountFunc: PropTypes.func.isRequired,
  /**
   * Executes when the key is imported
   */
  onActionComplete: PropTypes.func.isRequired,
};
