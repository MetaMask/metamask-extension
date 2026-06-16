import React, { useEffect, useState } from 'react';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  QrCodeScan,
} from './components';
import { AddDeviceSettingsStep } from './constant';

const AddDeviceSettings = () => {
  const [step, setStep] = useState(AddDeviceSettingsStep.ScanQrCode);

  useEffect(() => {
    if (step !== AddDeviceSettingsStep.ScanQrCode) {
      return;
    }

    const createQrSyncSession = async () => {
      await submitRequestToBackground<void>('messengerCall', [
        'QrSyncController:createSession',
        [],
      ]).catch(() => undefined);
    };

    createQrSyncSession();
  }, [step]);

  const handleNextStep = (type: AddDeviceSettingsStep) => {
    setStep(type);
  };

  const renderStep = () => {
    switch (step) {
      case AddDeviceSettingsStep.ScanQrCode:
        return <QrCodeScan onScanSuccess={handleNextStep} />;
      case AddDeviceSettingsStep.EnterVerificationCode:
        return <EnterVerificationCode onContinue={handleNextStep} />;
      case AddDeviceSettingsStep.EnterPassword:
        return <EnterPassword onContinue={handleNextStep} />;
      case AddDeviceSettingsStep.AddWallets:
        return <AddWallets onAddWallets={handleNextStep} />;
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default AddDeviceSettings;
