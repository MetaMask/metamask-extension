import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  Text,
} from '../../../../components/component-library';
import {
  BlockSize,
  BorderRadius,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getPasswordHint } from '../../../../selectors';

const PasswordHint = () => {
  const t = useI18nContext();
  const [isSamePasswordError, setIsSamePasswordError] = useState(false);
  const [hint, setHint] = useState(useSelector(getPasswordHint));
  // TODO: how to compare hint with current password?
  const currentPassword = null;

  const handleSubmitHint = () => {
    if (currentPassword === hint) {
      setIsSamePasswordError(true);
      return;
    }
    console.log('handleSubmitHint');
  };

  return (
    <div className="settings-password-hint">
      <form
        className="settings-password-hint__form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitHint();
        }}
      >
        <div className="settings-password-hint__content">
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={4}
          >
            {t('passwordHintDescription')}
          </Text>

          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={4}
          >
            {t('passwordHintLeaveHint')}
          </Text>

          <FormTextField
            value={hint}
            placeholder="e.g. mom’s home"
            width={BlockSize.Full}
            borderRadius={BorderRadius.LG}
            error={isSamePasswordError}
            helpText={isSamePasswordError ? t('passwordHintError') : null}
            onChange={(e) => setHint(e.target.value)}
            onFocus={() => setIsSamePasswordError(false)}
            marginBottom={4}
          />
        </div>
        <Button
          data-testid="password-hint-save"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          disabled={isSamePasswordError || !hint}
        >
          {t('save')}
        </Button>
      </form>
    </div>
  );
};

export default PasswordHint;
