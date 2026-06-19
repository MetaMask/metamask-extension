import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountWalletId } from '@metamask/account-api';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../../../store/background-connection';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  LoadingStep,
  QrCodeScan,
  Success,
} from './components';
import { AddDeviceSettingsStep } from './constant';

type QrSyncChannelDisconnectedEvent = {
  sessionId: string | null;
  retryable: boolean;
};

const AddDeviceSettings = () => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const [step, setStep] = useState(AddDeviceSettingsStep.ScanQrCode);
  const [password, setPassword] = useState<string | undefined>();

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

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => Promise<void>) | undefined;

    const watchQrSyncErrors = async () => {
      unsubscribe = await subscribeToMessengerEvent<QrSyncChannelDisconnectedEvent>(
        'QrSyncController:channelDisconnected',
        async (event) => {
          console.log('QrSyncChannelDisconnectedEvent: channel disconnected', event);
          await submitRequestToBackground<void>('messengerCall', [
            'QrSyncController:resetState',
            [],
          ]).catch(() => undefined);

          if (isMounted) {
            navigate(DEFAULT_ROUTE);
          }
        },
      ).catch(() => undefined);
    };

    watchQrSyncErrors();

    return () => {
      isMounted = false;
      unsubscribe?.().catch(() => undefined);
    };
  }, [navigate]);

  const handleNextStep = useCallback((type: AddDeviceSettingsStep) => {
    setStep(type);
  }, []);

  const handleAddWallets = useCallback(async (entropyIds: string[]) => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:syncAccounts',
      [password, entropyIds],
    ]);
    handleNextStep(AddDeviceSettingsStep.SyncingWallets);
  }, [password, handleNextStep]);

  const renderStep = () => {
    switch (step) {
      case AddDeviceSettingsStep.ScanQrCode:
        return <QrCodeScan onScanSuccess={handleNextStep} />;
      case AddDeviceSettingsStep.EnterVerificationCode:
        return <EnterVerificationCode onContinue={handleNextStep} />;
      case AddDeviceSettingsStep.ValidatingDevice:
        return (
          <LoadingStep
            title={`${t('add_device_validating_title')}...`}
            message={t('add_device_validating_desc')}
            waitForMessengerEvent="QrSyncController:syncOfferReceived"
            onComplete={() => handleNextStep(AddDeviceSettingsStep.EnterPassword)}
          />
        );
      case AddDeviceSettingsStep.EnterPassword:
        return <EnterPassword onContinue={handleNextStep} onPasswordChange={setPassword} />;
      case AddDeviceSettingsStep.AddWallets:
        return <AddWallets onAddWallets={handleAddWallets} />;
      case AddDeviceSettingsStep.SyncingWallets:
        return (
          <LoadingStep
            title={`${t('add_device_syncing_title')}...`}
            message={t('add_device_syncing_desc')}
            waitForMessengerEvent="QrSyncController:syncCompleted"
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
