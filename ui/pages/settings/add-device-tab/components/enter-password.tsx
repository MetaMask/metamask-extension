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
import { AddDeviceSettingsStep } from '../constant';

type EnterPasswordProps = {
  onContinue: (type: AddDeviceSettingsStep) => void;
};

const EnterPassword = ({ onContinue }: EnterPasswordProps) => {
  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const t = useI18nContext();

  const onSubmit = useCallback(async () => {
    try {
      await verifyPassword(password);
      onContinue(AddDeviceSettingsStep.AddWallets);
    } catch {
      setIsIncorrectPasswordError(true);
    }
  }, [password, onContinue]);

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
            autoFocus
          />
        </form>
      </Box>
      <Button
        className="w-full mt-auto"
        onClick={onSubmit}
        isDisabled={isIncorrectPasswordError || !password}
      >
        {t('continue')}
      </Button>
    </Box>
  );
};

export default EnterPassword;
