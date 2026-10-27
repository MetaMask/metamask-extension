import React, { useEffect, useReducer, useRef, useState } from 'react';
import browser from 'webextension-polyfill';
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

const FOCUS_TIMEOUT_MS = 5000;

/**
 * Waits for the page to get focus back, for a few seconds at most.
 *
 * @returns Resolves once the page has focus; rejects when it did not come back.
 */
const waitForFocus = (): Promise<void> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return new Promise<void>((resolve, reject) => {
    const onFocus = () => {
      clearTimeout(timeout);
      window.removeEventListener('focus', onFocus);
      resolve();
    };
    timeout = setTimeout(() => {
      window.removeEventListener('focus', onFocus);
      reject(new Error('The page did not get focus back'));
    }, FOCUS_TIMEOUT_MS);
    window.addEventListener('focus', onFocus);
    // Focus can come back before the listener is added.
    if (document.hasFocus()) {
      onFocus();
    }
  });
};

/**
 * Reads the clipboard. Right after the browser's permission prompt the page
 * has no focus and the read fails: it is read again once focus is back.
 *
 * @returns The clipboard's text.
 */
const readClipboard = async (): Promise<string> => {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    if (document.hasFocus()) {
      throw error;
    }
    await waitForFocus();
    return navigator.clipboard.readText();
  }
};

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

  // Reading the clipboard needs the optional `clipboardRead` permission, and
  // focus on this page (see srp-input-import).
  const paste = async () => {
    try {
      if (
        !(await browser.permissions.request({ permissions: ['clipboardRead'] }))
      ) {
        return;
      }
      window.focus();
      inputRef.current?.focus();
      handleChange(await readClipboard());
    } catch {
      // Nothing to paste: the user can still type or paste in the boxes.
    }
  };

  // A cooldown with a wait time shows as the countdown, also once it ended.
  const showError =
    error !== undefined &&
    !(resendAvailableAt !== undefined && COOLDOWN_CODES.has(error));
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

  return (
    <StepLayout
      title={t('mfaOtpTitle')}
      description={
        step.email
          ? t('mfaOtpDescriptionWithEmail', [maskEmail(step.email)])
          : t('mfaOtpDescription')
      }
      footer={
        <Button
          variant={canResend ? ButtonVariant.Primary : ButtonVariant.Secondary}
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
      }
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Button
          variant={ButtonVariant.Tertiary}
          // The hover pill keeps its padding; the margin lines the text up
          // with the last box.
          className="self-end -mr-4"
          onClick={paste}
          data-testid={MfaFlowTestIds.PASTE_BUTTON}
        >
          {t('mfaOtpPaste')}
        </Button>
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
        {showError && error ? <StepError code={error} /> : null}
        {codeResent && !error ? (
          <StepMessage>{t('mfaOtpResent')}</StepMessage>
        ) : null}
      </Box>
    </StepLayout>
  );
};

export default CodeStep;
