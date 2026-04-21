import React, { useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Button,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../../../components/component-library';
import { AddDeviceSettingsStep } from '../constant';

type EnterPasswordProps = {
  onContinue: (type: AddDeviceSettingsStep) => void;
};

const EnterPassword = ({ onContinue }: EnterPasswordProps) => {
  const [password, setPassword] = useState('');
  const t = useI18nContext();
  return (
    <Box className="p-4 flex flex-1 flex-col gap-4">
      <Text
        variant={TextVariant.HeadingLg}
        className="text-[26px]"
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('enter_your_password')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('enter_your_password_desc')}
      </Text>
      <FormTextField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        size={FormTextFieldSize.Lg}
      />
      <Button
        className="w-full mt-auto"
        onClick={() => onContinue(AddDeviceSettingsStep.AddWallets)}
      >
        {t('continue')}
      </Button>
    </Box>
  );
};

export default EnterPassword;
