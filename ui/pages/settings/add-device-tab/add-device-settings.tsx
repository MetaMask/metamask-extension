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
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  LoadingStep,
  QrCodeScan,
  Success,
} from './components';
import { AddDeviceSettingsStep } from './constant';

const AddDeviceSettings = () => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const [step, setStep] = useState(AddDeviceSettingsStep.ScanQrCode);

  const handleNextStep = (type: AddDeviceSettingsStep) => {
    setStep(type);
  };

  const renderStep = () => {
    switch (step) {
      case AddDeviceSettingsStep.ScanQrCode:
        return <QrCodeScan onScanSuccess={handleNextStep} />;
      case AddDeviceSettingsStep.EnterVerificationCode:
        return <EnterVerificationCode onContinue={handleNextStep} />;
      case AddDeviceSettingsStep.ValidatingDevice:
        return (
          <LoadingStep
            title={t('add_device_validating_title')}
            message={t('add_device_validating_desc')}
            onComplete={() =>
              handleNextStep(AddDeviceSettingsStep.EnterPassword)
            }
          />
        );
      case AddDeviceSettingsStep.EnterPassword:
        return <EnterPassword onContinue={handleNextStep} />;
      case AddDeviceSettingsStep.AddWallets:
        return <AddWallets onAddWallets={handleNextStep} />;
      case AddDeviceSettingsStep.SyncingWallets:
        return (
          <LoadingStep
            title={t('add_device_syncing_title')}
            message={t('add_device_syncing_desc')}
            onComplete={() => handleNextStep(AddDeviceSettingsStep.Success)}
          />
        );
      case AddDeviceSettingsStep.Success:
        return <Success onDone={() => navigate(DEFAULT_ROUTE)} />;
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default AddDeviceSettings;
