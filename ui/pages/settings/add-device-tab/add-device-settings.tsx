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
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  QrCodeScan,
} from './components';
import { AddDeviceSettingsStep } from './constant';

const AddDeviceSettings = () => {
  const navigate = useNavigate();
  const t = useI18nContext();
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
    <>
      {renderStep()}
    </>
  );
};

export default AddDeviceSettings;
