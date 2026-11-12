import PropTypes from 'prop-types';
import React, { useState } from 'react';
import FileInput from 'react-simple-file-input';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FormTextField,
  HelpText,
  HelpTextSeverity,
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
  onClearImportError,
  onJsonFileChange,
  importErrorMessage,
}) {
  const t = useI18nContext();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fileContents, setFileContents] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState();

  const isPrimaryDisabled = fileContents === '';
  const passwordErrors = [
    t('jsonImportPasswordRequired'),
    t('jsonImportPasswordIncorrect'),
    t('jsonImportPasswordIncorrectOrOptional'),
  ];
  const passwordError = passwordErrors.includes(importErrorMessage)
    ? importErrorMessage
    : undefined;
  const fileError =
    errorMessage ?? (passwordError ? undefined : importErrorMessage);
  const fileErrorId = 'json-file-error';
  const passwordErrorId = 'json-password-error';

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
      <Box flexDirection={BoxFlexDirection.Column} gap={1}>
        <label
          htmlFor="file-input"
          className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-muted px-4 py-8 focus-within:outline focus-within:outline-2 focus-within:outline-primary-default"
        >
          <FileInput
            id="file-input"
            data-testid="file-input"
            readAs="text"
            aria-invalid={Boolean(fileError)}
            aria-describedby={fileError ? fileErrorId : undefined}
            onChange={(file) => {
              setFileName(file?.name ?? '');
            }}
            onLoad={(event) => {
              setErrorMessage();
              setFileContents(event.target.result);
              onJsonFileChange?.();
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
        {fileError ? (
          <HelpText id={fileErrorId} severity={HelpTextSeverity.Danger}>
            {fileError}
          </HelpText>
        ) : null}
      </Box>

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
        placeholder={t('enterOptionalPassword')}
        helpText={passwordError}
        helpTextProps={passwordError ? { id: passwordErrorId } : undefined}
        isError={Boolean(passwordError)}
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          if (passwordError) {
            onClearImportError?.();
          }
        }}
        inputProps={{
          'aria-label': t('enterOptionalPassword'),
          'aria-describedby': passwordError ? passwordErrorId : undefined,
          onKeyPress: handleKeyPress,
        }}
        type={showPassword ? TextFieldType.Text : TextFieldType.Password}
        endAccessory={
          <ButtonIcon
            iconName={showPassword ? IconName.Eye : IconName.EyeSlash}
            size={ButtonIconSize.Md}
            ariaLabel={showPassword ? t('hide') : t('show')}
            aria-pressed={showPassword}
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
   * Clears the import error shown under the password field
   */
  onClearImportError: PropTypes.func,
  /**
   * Resets password-attempt state when a different file is chosen
   */
  onJsonFileChange: PropTypes.func,
  /**
   * Import error message
   */
  importErrorMessage: PropTypes.string,
};
