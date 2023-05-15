import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FileInput from 'react-simple-file-input';
import {
  ButtonLink,
  FormTextField,
  Label,
  Text,
  TEXT_FIELD_SIZES,
  TEXT_FIELD_TYPES,
} from '../../../components/component-library';
import {
  Size,
  TextVariant,
  TextAlign,
  FLEX_DIRECTION,
  DISPLAY,
  JustifyContent,
  FontWeight,
} from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { displayWarning } from '../../../store/actions';
import Box from '../../../components/ui/box/box';
import ToggleButton from '../../../components/ui/toggle-button';
import BottomButtons from './bottom-buttons';

JsonImportSubview.propTypes = {
  importAccountFunc: PropTypes.func.isRequired,
};

export default function JsonImportSubview({ importAccountFunc }) {
  const t = useI18nContext();
  const warning = useSelector((state) => state.appState.warning);
  const [password, setPassword] = useState('');
  const [fileContents, setFileContents] = useState('');
  const [isPasswordless, setIsPasswordless] = useState(false);

  function isPrimaryDisabled() {
    if (fileContents === '') {
      return true;
    }
    if (!isPasswordless && password === '') {
      return true;
    }

    return false;
  }

  function handlePasswordlessCheck() {
    if (password !== '') {
      return;
    }
    setIsPasswordless(!isPasswordless);
    setPassword('');
  }

  function handleKeyPress(event) {
    if (!isPrimaryDisabled() && event.key === 'Enter') {
      event.preventDefault();
      _importAccountFunc();
    }
  }

  function _importAccountFunc() {
    if (isPrimaryDisabled()) {
      displayWarning(t('needImportFile'));
    } else {
      importAccountFunc('JSON File', [fileContents, password]);
    }
  }

  return (
    <>
      <Text variant={TextVariant.bodyMd} textAlign={TextAlign.CENTER}>
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

      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        justifyContent={JustifyContent.spaceBetween}
      >
        <Label
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Normal}
          marginRight={2}
        >
          {t('importJsonWithoutPassword')}
        </Label>
        <ToggleButton
          value={isPasswordless}
          onToggle={handlePasswordlessCheck}
          disabled={password !== ''}
        ></ToggleButton>
      </Box>

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

      {!isPasswordless && (
        <FormTextField
          id="json-password-box"
          size={TEXT_FIELD_SIZES.LARGE}
          autoFocus
          type={TEXT_FIELD_TYPES.PASSWORD}
          helpText={warning}
          error
          placeholder={t('enterPassword')}
          value={password}
          onChange={(event) => {
            setIsPasswordless(false);
            setPassword(event.target.value);
          }}
          inputProps={{
            onKeyPress: handleKeyPress,
          }}
          marginBottom={4}
        />
      )}

      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={isPrimaryDisabled()}
      />
    </>
  );
}
