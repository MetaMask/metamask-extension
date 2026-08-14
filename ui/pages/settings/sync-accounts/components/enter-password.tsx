import React, { FormEvent, useCallback, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Button,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../../components/component-library';
import { verifyPassword } from '../../../../store/actions';

type EnterPasswordProps = {
  onPasswordChange: (password: string) => void;
};

const EnterPassword = ({ onPasswordChange }: EnterPasswordProps) => {
  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const t = useI18nContext();

  const onSubmit = useCallback(async () => {
    try {
      await verifyPassword(password);
      onPasswordChange(password);
    } catch (error) {
      setIsIncorrectPasswordError(true);
    }
  }, [password, onPasswordChange]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="flex-1">
      <Text
        variant={TextVariant.HeadingLg}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('enter_your_password')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('enter_your_password_desc')}
      </Text>
      <Box asChild>
        <form
          onSubmit={(e: FormEvent<HTMLElement>) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <FormTextField
            value={password}
            type={TextFieldType.Password}
            onChange={(e) => {
              setPassword(e.target.value);
              setIsIncorrectPasswordError(false);
            }}
            size={FormTextFieldSize.Lg}
            error={isIncorrectPasswordError}
            helpText={
              isIncorrectPasswordError ? t('unlockPageIncorrectPassword') : null
            }
            inputProps={{ 'data-testid': 'qr-sync-password-input' }}
            autoFocus
          />
        </form>
      </Box>
      <Button
        className="w-full mt-auto"
        onClick={onSubmit}
        isDisabled={isIncorrectPasswordError || !password}
        data-testid="qr-sync-password-continue"
      >
        {t('continue')}
      </Button>
    </Box>
  );
};

export default EnterPassword;
