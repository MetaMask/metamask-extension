import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  IconName,
  ButtonIconSize,
  TextVariant,
  TextColor,
  FontWeight,
  ButtonIcon,
  Text,
} from '@metamask/design-system-react';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  QrCodeScan,
} from './components';
import { AddDeviceSettingsStep } from './constant';
import { t } from 'shared/lib/translate';

const AddDeviceSettings = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(AddDeviceSettingsStep.EnterPassword);

  const handleNextStep = (type: AddDeviceSettingsStep) => {
    setStep(type);
  };

  const renderStep = () => {
    switch (step) {
      case AddDeviceSettingsStep.EnterPassword:
        return <EnterPassword onContinue={handleNextStep} />;
      case AddDeviceSettingsStep.AddWallets:
        return <AddWallets onAddWallets={handleNextStep} />;
      case AddDeviceSettingsStep.ScanQrCode:
        return <QrCodeScan onScanSuccess={handleNextStep} />;
      case AddDeviceSettingsStep.EnterVerificationCode:
        return <EnterVerificationCode />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box className="flex items-center justify-between">
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel="back"
          size={ButtonIconSize.Sm}
          onClick={() => navigate(-1)}
          data-testid="settings-v2-header-back-button"
        />
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
        >
          {t('addDevice')}
        </Text>
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel="close"
          size={ButtonIconSize.Sm}
          onClick={() => navigate(-1)}
          data-testid="settings-v2-header-close-button"
        />
      </Box>
      {renderStep()}
    </Box>
  );
};

export default AddDeviceSettings;
