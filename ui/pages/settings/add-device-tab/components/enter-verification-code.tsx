import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  FormTextField,
  TextFieldType,
} from '../../../../components/component-library';

const CODE_LENGTH = 6;

const EnterVerificationCode = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<HTMLInputElement[]>(Array(CODE_LENGTH).fill(null));

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/gu, '').slice(-1);
    const updated = [...code];
    updated[index] = digit;
    setCode(updated);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const updated = [...code];
      updated[index - 1] = '';
      setCode(updated);
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (code.every((d) => d.length === 1)) {
      navigate(-1);
    }
  }, [code, navigate]);

  return (
    <Box className="p-4 pt-0 flex-1 flex-col gap-6">
      <Box className="flex-col gap-2">
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
      <Box className="flex-row gap-2 justify-between px-6">
        {code.map((digit, index) => (
          <FormTextField
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref as unknown as HTMLInputElement;
            }}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={({ nativeEvent }) =>
              handleKeyPress(nativeEvent.key, index)
            }
            type={TextFieldType.Number}
            maxLength={1}
            className="w-12 h-[54px] p-0 rounded-lg text-center"
            autoFocus={index === 0}
          />
        ))}
      </Box>
    </Box>
  );
};

export default EnterVerificationCode;
