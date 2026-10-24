import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getErrorHandling } from '../../../hooks/identity/mfa/engine/errors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { maskEmail } from '../../../hooks/identity/mfa/mask-email';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, {
  StepError,
  StepMessage,
  INPUT_A11Y_PROPS,
  type StepProps,
} from './step-layout';

const CODE_LENGTH = 6;
const CELLS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

/**
 * Keeps the digits of typed or pasted text, up to a full code.
 *
 * @param text - What was typed or pasted.
 * @returns The code's digits.
 */
const getCodeDigits = (text: string) =>
  text.replace(/\D/gu, '').slice(0, CODE_LENGTH);

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
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const secondsLeft = useSecondsUntil(state.resendAvailableAt);
  const { busy, error, codeResent, resendAvailableAt } = state;
  const { codeSent } = step;
  // Authenticator app codes are on the user's app, so nothing is sent or
  // resent.
  const isTotp = step.method === 'totp';
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

  // The first email code of a flow can hit the cooldown left by the previous
  // one.
  useEffect(() => {
    if (
      !isTotp &&
      !codeSent &&
      resendAvailableAt !== undefined &&
      secondsLeft === 0
    ) {
      onAction({ type: 'resend' });
    }
  }, [isTotp, codeSent, resendAvailableAt, secondsLeft, onAction]);

  useEffect(() => {
    if (codeSent) {
      inputRef.current?.focus();
    }
  }, [codeSent]);

  // Submits a complete code once it was sent, so digits typed or pasted while
  // it was still sending are not left on screen.
  useEffect(() => {
    if (codeSent && code.length === CODE_LENGTH) {
      onAction({ type: 'submitCode', code });
    }
  }, [codeSent, code, onAction]);

  const handleChange = (text: string) => {
    if (busy && codeSent) {
      return;
    }
    setCode(getCodeDigits(text));
  };

  // An email cooldown with a wait time shows as the countdown on the resend
  // button, also once it ended. Authenticator app errors always show.
  const showError =
    error !== undefined &&
    (isTotp || !(resendAvailableAt !== undefined && COOLDOWN_CODES.has(error)));
  // The code on screen can no longer be used: the main action is a new one.
  const needsNewCode =
    showError && error !== undefined && getErrorHandling(error) === 'restart';

  const getResendLabel = () => {
    if (isCoolingDown) {
      return t(codeSent ? 'mfaOtpResendIn' : 'mfaOtpSendIn', [
        String(secondsLeft),
      ]);
    }
    return t(busy && !codeSent ? 'mfaOtpSending' : 'mfaOtpResend');
  };
  const canResend = !isCoolingDown && !busy;

  const getDescription = () => {
    if (isTotp) {
      return t('mfaOtpDescriptionTotp');
    }
    return step.email
      ? t('mfaOtpDescriptionWithEmail', [maskEmail(step.email)])
      : t('mfaOtpDescription');
  };

  const renderTotpFooter = () =>
    !codeSent && !busy ? (
      // The verification failed to start: start it again, after any cooldown.
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        isFullWidth
        isDisabled={isCoolingDown}
        onClick={() => onAction({ type: 'resend' })}
        data-testid={MfaFlowTestIds.RESEND_BUTTON}
      >
        {isCoolingDown
          ? t('mfaOtpRetryIn', [String(secondsLeft)])
          : t('mfaOtpRetry')}
      </Button>
    ) : null;

  return (
    <StepLayout
      title={t('mfaOtpTitle')}
      description={getDescription()}
      footer={
        isTotp ? (
          renderTotpFooter()
        ) : (
          <Button
            variant={
              canResend ? ButtonVariant.Primary : ButtonVariant.Secondary
            }
            size={ButtonSize.Lg}
            isFullWidth
            // No submit button: this shows the code being checked.
            isLoading={busy && codeSent}
            isDisabled={!canResend}
            onClick={() => onAction({ type: 'resend' })}
            data-testid={MfaFlowTestIds.RESEND_BUTTON}
          >
            {needsNewCode ? t('mfaOtpGetNewCode') : getResendLabel()}
          </Button>
        )
      }
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={2} paddingTop={2}>
        {/* One input for typing, pasting and one-time-code autofill, over
            the six boxes that show the code. */}
        <Box className="relative">
          {/* The input below is what assistive tech reads. */}
          <Box flexDirection={BoxFlexDirection.Row} gap={2} aria-hidden="true">
            {CELLS.map((index) => (
              <Box
                key={index}
                className={`flex-1 h-14 flex items-center justify-center rounded-xl border-[1.5px] bg-muted ${
                  isFocused && index === Math.min(code.length, CODE_LENGTH - 1)
                    ? 'border-primary-default'
                    : 'border-muted'
                }`}
              >
                <Text variant={TextVariant.HeadingMd} className="text-[22px]">
                  {code[index] ?? ''}
                </Text>
              </Box>
            ))}
          </Box>
          <input
            ref={inputRef}
            value={code}
            onChange={(event) => handleChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={CODE_LENGTH}
            autoComplete="one-time-code"
            inputMode="numeric"
            spellCheck={false}
            autoCorrect="off"
            aria-invalid={showError}
            {...INPUT_A11Y_PROPS}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            data-testid={MfaFlowTestIds.CODE_INPUT}
          />
        </Box>
        {showError && error ? (
          <StepError code={error} method={step.method} />
        ) : null}
        {codeResent && !error ? (
          <StepMessage>{t('mfaOtpResent')}</StepMessage>
        ) : null}
      </Box>
    </StepLayout>
  );
};

export default CodeStep;
