import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { getPasswordHint, getPasswordHash } from '../../../../selectors';
import { setPasswordHint } from '../../../../store/actions';

const PasswordHint = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [isSamePasswordError, setIsSamePasswordError] = useState(false);
  const [hint, setHint] = useState(useSelector(getPasswordHint));
  const passwordHash = useSelector(getPasswordHash);

  const handleSubmitHint = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      dispatch(setPasswordHint(hint, passwordHash));
    } catch (error) {
      setIsSamePasswordError(true);
    }
  };

  return (
    <div className="settings-password-hint">
      <form
        className="settings-password-hint__form"
        onSubmit={handleSubmitHint}
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
