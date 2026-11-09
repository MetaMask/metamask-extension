import PropTypes from 'prop-types';
import React, { useState } from 'react';
import {
  Box,
  FormTextField,
  TextFieldSize,
  TextFieldType,
} from '../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';
import ShowHideToggle from '../../ui/show-hide-toggle';
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
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1 }}
    >
      <FormTextField
        id="private-key-box"
        size={TextFieldSize.Lg}
        autoFocus
        helpText={importErrorMessage}
        error={Boolean(importErrorMessage)}
        placeholder={t('enterYourPrivateKey')}
        value={privateKey}
        onChange={(event) => setPrivateKey(event.target.value)}
        inputProps={{
          'aria-label': t('enterYourPrivateKey'),
          onKeyPress: handleKeyPress,
          style: {
            height: 24,
            lineHeight: '24px',
          },
        }}
        type={showPrivateKey ? TextFieldType.Text : TextFieldType.Password}
        textFieldProps={{
          style: {
            height: 116,
            minHeight: 116,
            alignItems: 'flex-start',
            paddingTop: 12,
            paddingBottom: 12,
          },
          endAccessory: (
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              style={{ height: 24 }}
            >
              <ShowHideToggle
                shown={showPrivateKey}
                id="show-hide-private-key"
                title={t('privateKeyShow')}
                ariaLabelShown={t('privateKeyShown')}
                ariaLabelHidden={t('privateKeyHidden')}
                onChange={() => setShowPrivateKey(!showPrivateKey)}
              />
            </Box>
          ),
        }}
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
