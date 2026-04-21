import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Input,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const CODE_LENGTH = 6;
const DIGITS_REGEX = /[^0-9]/gu;

const EnterVerificationCode = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(() =>
    Array(CODE_LENGTH).fill(''),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(CODE_LENGTH).fill(null),
  );

  const focusInput = useCallback((index: number) => {
    const target = inputRefs.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  }, []);

  const handleChange = useCallback(
    (rawValue: string, index: number) => {
      const sanitized = rawValue.replace(DIGITS_REGEX, '');

      if (!sanitized) {
        setCode((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        return;
      }

      // Support pasting / multi-character input by spreading across boxes.
      setCode((prev) => {
        const next = [...prev];
        for (let i = 0; i < sanitized.length && index + i < CODE_LENGTH; i++) {
          next[index + i] = sanitized[i];
        }
        return next;
      });

      const nextIndex = Math.min(
        index + sanitized.length,
        CODE_LENGTH - 1,
      );
      focusInput(nextIndex);
    },
    [focusInput],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      const { key } = event;

      if (key === 'Backspace') {
        if (code[index]) {
          setCode((prev) => {
            const next = [...prev];
            next[index] = '';
            return next;
          });
          return;
        }
        if (index > 0) {
          event.preventDefault();
          setCode((prev) => {
            const next = [...prev];
            next[index - 1] = '';
            return next;
          });
          focusInput(index - 1);
        }
        return;
      }

      if (key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        focusInput(index - 1);
        return;
      }

      if (key === 'ArrowRight' && index < CODE_LENGTH - 1) {
        event.preventDefault();
        focusInput(index + 1);
      }
    },
    [code, focusInput],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      const pasted = event.clipboardData
        .getData('text')
        .replace(DIGITS_REGEX, '');
      if (!pasted) {
        return;
      }
      event.preventDefault();
      handleChange(pasted, index);
    },
    [handleChange],
  );

  const handleFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      event.target.select();
    },
    [],
  );

  useEffect(() => {
    if (code.every((digit) => digit.length === 1)) {
      navigate(-1);
    }
  }, [code, navigate]);

  return (
    <Box className="p-4 flex flex-1 flex-col gap-6">
      <Box className="flex flex-col gap-2">
        <Text
          variant={TextVariant.HeadingLg}
          className="text-[26px]"
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
        >
          {t('enter_verification_code')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('enter_verification_code_desc')}
        </Text>
      </Box>
      <Box className="flex flex-row items-center justify-between gap-2 px-6 w-[80%] mx-auto">
        {code.map((digit, index) => (
          <Input
            key={index}
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
    </Box>
  );
};

export default EnterVerificationCode;
