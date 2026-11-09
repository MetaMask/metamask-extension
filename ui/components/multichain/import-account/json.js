import PropTypes from 'prop-types';
import React, { useState } from 'react';
import FileInput from 'react-simple-file-input';
import { TextButton } from '@metamask/design-system-react';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  FormTextField,
  Icon,
  IconName,
  IconSize,
  Text,
  TextFieldSize,
  TextFieldType,
} from '../../component-library';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ShowHideToggle from '../../ui/show-hide-toggle';
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
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={4}
      style={{ flex: 1 }}
    >
      <Box
        as="label"
        htmlFor="file-input"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        backgroundColor={BackgroundColor.backgroundMuted}
        borderRadius={BorderRadius.XL}
        gap={2}
        paddingTop={8}
        paddingBottom={8}
        paddingLeft={4}
        paddingRight={4}
        style={{ position: 'relative', cursor: 'pointer' }}
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
          color={IconColor.iconAlternative}
        />
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {fileName || t('chooseJsonFile')}
        </Text>
      </Box>

      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
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
        error={Boolean(helpText)}
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
        textFieldProps={{
          endAccessory: (
            <ShowHideToggle
              shown={showPassword}
              id="show-hide-json-password"
              title={showPassword ? t('hide') : t('show')}
              ariaLabelShown={t('hide')}
              ariaLabelHidden={t('show')}
              onChange={() => setShowPassword(!showPassword)}
            />
          ),
        }}
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
