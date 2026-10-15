import React, { useEffect, useReducer, useRef, useState } from 'react';
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
import StepLayout, {
  StepError,
  StepMessage,
  INPUT_A11Y_PROPS,
  type StepProps,
} from './step-layout';

const CODE_LENGTH = 6;
const COOLDOWN_CODES = new Set(['otp_resend_cooldown', 'rate_limited']);

// The clock is state, as the React Compiler caches what render computes:
// `Date.now()` read during render would never move. Being up to a second
// behind never reads 0 for a cooldown that just started, so the auto-send
// below cannot fire early.
const useSecondsUntil = (at?: number) => {
  const [now, tick] = useReducer(() => Date.now(), undefined, Date.now);
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return at === undefined ? 0 : Math.max(0, Math.ceil((at - now) / 1000));
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

  // A cooldown with a wait time shows as the countdown, also once it ended.
  const showError =
    error !== undefined &&
    !(resendAvailableAt !== undefined && COOLDOWN_CODES.has(error));

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
        maxLength={CODE_LENGTH}
        inputProps={{
          ...INPUT_A11Y_PROPS,
          autoComplete: 'one-time-code',
          inputMode: 'numeric',
          spellCheck: false,
          autoCorrect: 'off',
        }}
        data-testid={MfaFlowTestIds.CODE_INPUT}
      />
      {showError && error ? <StepError code={error} /> : null}
      {codeResent && !error ? (
        <StepMessage>{t('mfaOtpResent')}</StepMessage>
      ) : null}
      <Box>{renderResend()}</Box>
    </StepLayout>
  );
};

export default CodeStep;
