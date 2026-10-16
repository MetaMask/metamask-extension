import React, { useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  TextField,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, {
  StepMessage,
  INPUT_A11Y_PROPS,
  type StepProps,
} from './step-layout';

// No leading, trailing or repeated dot in the local part.
const EMAIL_PATTERN = /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)+$/u;

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
      // One message at a time: the address check replaces the server's error.
      error={showInvalid ? undefined : state.error}
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
      <Box flexDirection={BoxFlexDirection.Column} gap={2} paddingTop={4}>
        <TextField
          value={email}
          startAccessory={
            <Icon name={IconName.Mail} color={IconColor.IconAlternative} />
          }
          onChange={(event) => {
            setEmail(event.target.value);
            setShowInvalid(false);
          }}
          placeholder={t('mfaEmailEntryPlaceholder')}
          isError={showInvalid || state.error !== undefined}
          autoFocus
          inputProps={{
            ...INPUT_A11Y_PROPS,
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
          <StepMessage isError>{t('mfaEmailEntryInvalid')}</StepMessage>
        ) : null}
      </Box>
    </StepLayout>
  );
};

export default EmailEntryStep;
