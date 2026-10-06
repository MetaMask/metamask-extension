import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextButton,
  TextColor,
  TextField,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { StepError, type StepProps } from './step-layout';

const CODE_LENGTH = 6;
const COOLDOWN_CODES = ['otp_resend_cooldown', 'rate_limited'];

const getSecondsUntil = (at?: number) =>
  at === undefined ? 0 : Math.max(0, Math.ceil((at - Date.now()) / 1000));

// Derived during render: a value kept in state would still read 0 on the
// render that receives a new cooldown, and the auto-send below would fire.
const useSecondsUntil = (at?: number) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (at === undefined) {
      return undefined;
    }
    const id = setInterval(() => {
      setTick((tick) => tick + 1);
      if (getSecondsUntil(at) === 0) {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [at]);
  return getSecondsUntil(at);
};

const CodeStep = ({ step, state, onAction }: StepProps<'otp'>) => {
  const t = useI18nContext();
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const secondsLeft = useSecondsUntil(state.resendAvailableAt);
  const { busy, error, codeResent, resendAvailableAt } = state;
  const { codeSent } = step;
  const isCoolingDown = secondsLeft > 0;

  const [clearedFor, setClearedFor] = useState({ error, codeResent });
  if (clearedFor.error !== error || clearedFor.codeResent !== codeResent) {
    setClearedFor({ error, codeResent });
    if (error || codeResent) {
      setCode('');
    }
  }

  useEffect(() => {
    if (error || codeResent) {
      inputRef.current?.focus();
    }
  }, [error, codeResent]);

  // The first code of a flow can hit the cooldown left by the previous one.
  useEffect(() => {
    if (!codeSent && resendAvailableAt !== undefined && secondsLeft === 0) {
      onAction({ type: 'resend' });
    }
  }, [codeSent, resendAvailableAt, secondsLeft, onAction]);

  useEffect(() => {
    if (codeSent) {
      inputRef.current?.focus();
    }
  }, [codeSent]);

  const submit = (value: string) =>
    onAction({ type: 'submitCode', code: value });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (busy && codeSent) {
      return;
    }
    const digits = event.target.value.replace(/\D/gu, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (codeSent && digits.length === CODE_LENGTH) {
      submit(digits);
    }
  };

  const renderResend = () => {
    if (isCoolingDown || (busy && !codeSent)) {
      let label = t('mfaOtpSending');
      if (isCoolingDown) {
        label = t(codeSent ? 'mfaOtpResendIn' : 'mfaOtpSendIn', [
          String(secondsLeft),
        ]);
      }
      return (
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {label}
        </Text>
      );
    }
    return (
      <TextButton
        onClick={() => onAction({ type: 'resend' })}
        data-testid={MfaFlowTestIds.RESEND_BUTTON}
      >
        {t('mfaOtpResend')}
      </TextButton>
    );
  };

  const showError =
    error !== undefined && !(isCoolingDown && COOLDOWN_CODES.includes(error));

  return (
    <StepLayout
      title={t('mfaOtpTitle')}
      description={
        step.email
          ? t('mfaOtpDescriptionWithEmail', [step.email])
          : t('mfaOtpDescription')
      }
      footer={
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isLoading={busy && codeSent}
          isDisabled={!codeSent || code.length !== CODE_LENGTH}
          onClick={() => submit(code)}
          data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
        >
          {t('mfaOtpSubmit')}
        </Button>
      }
    >
      <TextField
        inputRef={inputRef}
        value={code}
        onChange={handleChange}
        isError={showError}
        inputProps={{ autoComplete: 'one-time-code', inputMode: 'numeric' }}
        data-testid={MfaFlowTestIds.CODE_INPUT}
      />
      {showError && error ? <StepError code={error} /> : null}
      {codeResent && !error ? (
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('mfaOtpResent')}
        </Text>
      ) : null}
      <Box>{renderResend()}</Box>
    </StepLayout>
  );
};

export default CodeStep;
