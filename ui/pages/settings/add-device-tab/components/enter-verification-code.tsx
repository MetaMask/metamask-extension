import React, { useCallback, useRef, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Input,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AddDeviceSettingsStep } from '../constant';

const CODE_LENGTH = 6;
const NON_DIGITS_REGEX = /\D/gu;
const SINGLE_DIGIT_REGEX = /^[0-9]$/u;
const TEMP_VERIFICATION_CODE = '123456';

const createEmptyCode = () => Array<string>(CODE_LENGTH).fill('');

type EnterVerificationCodeProps = {
  onContinue: (type: AddDeviceSettingsStep) => void;
};

const EnterVerificationCode = ({ onContinue }: EnterVerificationCodeProps) => {
  const t = useI18nContext();
  const [isError, setIsError] = useState(false);
  const [code, setCode] = useState<string[]>(createEmptyCode);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    const target = inputRefs.current[clampedIndex];
    target?.focus();
    target?.select();
  }, []);

  // Single place that persists a new code and reacts to completion, so the
  // change/paste/keydown handlers never duplicate validation or error resets.
  const commitCode = useCallback(
    (nextCode: string[]) => {
      setCode(nextCode);
      setIsError(false);

      const joined = nextCode.join('');
      if (joined.length < CODE_LENGTH) {
        return;
      }

      if (joined === TEMP_VERIFICATION_CODE) {
        onContinue(AddDeviceSettingsStep.EnterPassword);
      } else {
        setIsError(true);
      }
    },
    [onContinue],
  );

  // Writes one or more digits starting at `startIndex` (typing or pasting),
  // then moves focus to the box following the last digit written.
  const writeDigits = useCallback(
    (startIndex: number, digits: string) => {
      const nextCode = [...code];
      let cursor = startIndex;
      for (const digit of digits) {
        if (cursor >= CODE_LENGTH) {
          break;
        }
        nextCode[cursor] = digit;
        cursor += 1;
      }

      commitCode(nextCode);
      focusInput(cursor);
    },
    [code, commitCode, focusInput],
  );

  const clearDigit = useCallback(
    (index: number) => {
      const nextCode = [...code];
      nextCode[index] = '';
      commitCode(nextCode);
    },
    [code, commitCode],
  );

  const handleChange = useCallback(
    (rawValue: string, index: number) => {
      const sanitized = rawValue.replace(NON_DIGITS_REGEX, '');
      if (sanitized) {
        writeDigits(index, sanitized);
      } else {
        clearDigit(index);
      }
    },
    [writeDigits, clearDigit],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      const { key } = event;

      // Re-typing into a filled box must be handled here: the browser won't
      // fire onChange because the box is already at maxLength and the
      // controlled value is unchanged when the same digit is entered again.
      if (SINGLE_DIGIT_REGEX.test(key) && code[index]) {
        event.preventDefault();
        writeDigits(index, key);
        return;
      }

      switch (key) {
        case 'Backspace':
          // Owning Backspace prevents the native delete from also firing
          // onChange and clearing the box a second time.
          event.preventDefault();
          if (code[index]) {
            clearDigit(index);
          } else if (index > 0) {
            const nextCode = [...code];
            nextCode[index - 1] = '';
            commitCode(nextCode);
            focusInput(index - 1);
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          focusInput(index - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          focusInput(index + 1);
          break;
        default:
          break;
      }
    },
    [code, writeDigits, clearDigit, commitCode, focusInput],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      const pasted = event.clipboardData
        .getData('text')
        .replace(NON_DIGITS_REGEX, '');
      if (!pasted) {
        return;
      }
      event.preventDefault();
      writeDigits(index, pasted);
    },
    [writeDigits],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      event.target.select();
    },
    [],
  );

  return (
    <Box className="p-4 flex flex-1 flex-col gap-6">
      <Box className="flex flex-col gap-2">
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
        >
          {t('enter_verification_code')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('enter_verification_code_desc')}
        </Text>
      </Box>
      <Box className="flex flex-row items-center justify-between gap-2 mx-auto">
        {code.map((digit, index) => (
          <Input
            // The list is a fixed-length set of positional inputs, so the
            // index is a stable identity here.
            // eslint-disable-next-line react/no-array-index-key
            key={`verification-code-${index}`}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            value={digit}
            onChange={(event) => handleChange(event.target.value, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={(event) => handlePaste(event, index)}
            onFocus={handleFocus}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`${t('enter_verification_code')} ${index + 1}`}
            maxLength={1}
            autoFocus={index === 0}
            className="w-12 h-[54px] rounded-lg border border-muted bg-default text-center text-l-medium"
          />
        ))}
      </Box>
      {isError && (
        <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
          {t('enter_verification_code_error')}
        </Text>
      )}
    </Box>
  );
};

export default EnterVerificationCode;
