import PropTypes from 'prop-types';
import React, { useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FormTextField,
  IconName,
  TextFieldSize,
  TextFieldType,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import BottomButtons from './bottom-buttons';

export default function PrivateKeyImportView({
  importAccountFunc,
  onActionComplete,
  importErrorMessage,
}) {
  const t = useI18nContext();
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  function handleKeyPress(event) {
    if (privateKey !== '' && event.key === 'Enter') {
      event.preventDefault();
      _importAccountFunc();
    }
  }

  function _importAccountFunc() {
    importAccountFunc('privateKey', [privateKey]);
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="flex-1">
      <FormTextField
        id="private-key-box"
        size={TextFieldSize.Lg}
        autoFocus
        helpText={importErrorMessage}
        isError={Boolean(importErrorMessage)}
        placeholder={t('enterYourPrivateKey')}
        value={privateKey}
        onChange={(event) => setPrivateKey(event.target.value)}
        inputProps={{
          'aria-label': t('enterYourPrivateKey'),
          onKeyPress: handleKeyPress,
        }}
        type={showPrivateKey ? TextFieldType.Text : TextFieldType.Password}
        textFieldProps={{
          className: 'h-[116px] min-h-[116px] items-start py-3',
        }}
        endAccessory={
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            className="h-6"
          >
            <ButtonIcon
              iconName={showPrivateKey ? IconName.Eye : IconName.EyeSlash}
              size={ButtonIconSize.Md}
              ariaLabel={
                showPrivateKey ? t('privateKeyShown') : t('privateKeyHidden')
              }
              aria-pressed={showPrivateKey}
              data-testid="show-hide-private-key"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
            />
          </Box>
        }
      />

      <BottomButtons
        importAccountFunc={_importAccountFunc}
        isPrimaryDisabled={privateKey === ''}
        onActionComplete={onActionComplete}
      />
    </Box>
  );
}

PrivateKeyImportView.propTypes = {
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
