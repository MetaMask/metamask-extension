import React, { useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextField,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

const EmailEntryStep = ({ step, state, onAction }: StepProps<'emailEntry'>) => {
  const t = useI18nContext();
  const [email, setEmail] = useState(step.prefillEmail ?? '');
  const [showInvalid, setShowInvalid] = useState(false);
  const trimmed = email.trim();

  const submit = () => {
    if (!EMAIL_PATTERN.test(trimmed)) {
      setShowInvalid(true);
      return;
    }
    onAction({ type: 'submitEmail', email: trimmed });
  };

  return (
    <StepLayout
      title={t('mfaEmailEntryTitle')}
      description={t('mfaEmailEntryDescription')}
      error={state.error}
      footer={
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isLoading={state.busy}
          isDisabled={trimmed.length === 0}
          onClick={submit}
          data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
        >
          {t('mfaEmailEntryContinue')}
        </Button>
      }
    >
      <TextField
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setShowInvalid(false);
        }}
        placeholder={t('mfaEmailEntryPlaceholder')}
        isError={showInvalid || state.error !== undefined}
        autoFocus
        inputProps={{
          autoComplete: 'email',
          inputMode: 'email',
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              submit();
            }
          },
        }}
        data-testid={MfaFlowTestIds.EMAIL_INPUT}
      />
      {showInvalid ? (
        <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
          {t('mfaEmailEntryInvalid')}
        </Text>
      ) : null}
    </StepLayout>
  );
};

export default EmailEntryStep;
