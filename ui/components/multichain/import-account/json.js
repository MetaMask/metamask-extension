import PropTypes from 'prop-types';
import React, { useState } from 'react';
import FileInput from 'react-simple-file-input';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FormTextField,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextColor,
  TextFieldSize,
  TextFieldType,
  TextVariant,
} from '@metamask/design-system-react';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import BottomButtons from './bottom-buttons';

export default function JsonImportSubview({
  importAccountFunc,
  onActionComplete,
  importErrorMessage,
}) {
  const t = useI18nContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fileContents, setFileContents] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState();

  const isPrimaryDisabled = fileContents === '';
  const helpText = errorMessage ?? importErrorMessage;

  function handleKeyPress(event) {
    if (!isPrimaryDisabled && event.key === 'Enter') {
      event.preventDefault();
      _importAccountFunc();
    }
  }

  function _importAccountFunc() {
    if (isPrimaryDisabled) {
      setErrorMessage(t('needImportFile'));
    } else {
      importAccountFunc('json', [fileContents, password]);
    }
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="flex-1">
      <label
        htmlFor="file-input"
        className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-muted px-4 py-8"
      >
        <FileInput
          id="file-input"
          data-testid="file-input"
          accept=".json,application/json"
          readAs="text"
          onChange={(file) => {
            setFileName(file?.name ?? '');
          }}
          onLoad={(event) => {
            setErrorMessage();
            setFileContents(event.target.result);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
          }}
        />
        <Icon
          name={IconName.Upload}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {fileName || t('chooseJsonFile')}
        </Text>
      </label>

      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('fileImportNotWorking')}{' '}
        <TextButton size="body-md" asChild className="inline">
          <a
            href={ZENDESK_URLS.IMPORTED_ACCOUNT_JSON}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('clickHere')}
          </a>
        </TextButton>
      </Text>

      <FormTextField
        id="json-password-box"
        size={TextFieldSize.Lg}
        autoFocus
        helpText={helpText}
        isError={Boolean(helpText)}
        placeholder={t('enterOptionalPassword')}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
        }}
        inputProps={{
          'aria-label': t('enterOptionalPassword'),
          onKeyPress: handleKeyPress,
        }}
        type={showPassword ? TextFieldType.Text : TextFieldType.Password}
        endAccessory={
          <ButtonIcon
            iconName={showPassword ? IconName.Eye : IconName.EyeSlash}
            size={ButtonIconSize.Md}
            ariaLabel={showPassword ? t('hide') : t('show')}
            data-testid="show-hide-json-password"
            onClick={() => setShowPassword(!showPassword)}
          />
        }
      />

      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={isPrimaryDisabled}
        onActionComplete={(confirmed) => {
          setErrorMessage();
          onActionComplete(confirmed);
        }}
      />
    </Box>
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
  /**
   * Import error message
   */
  importErrorMessage: PropTypes.string,
};
