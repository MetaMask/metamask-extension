import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../../store/background-connection';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { QR_SYNC_PHASES } from '../../../../shared/constants/qr-sync';
import {
  selectIsQrSyncTerminal,
  selectQrSyncPhase,
  selectShouldCreateQrSyncSession,
} from '../../../selectors/qr-sync/qr-sync';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  LoadingStep,
  QrCodeScan,
  Success,
} from './components';

const AddDeviceSettings = () => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const qrSyncPhase = useSelector(selectQrSyncPhase);
  const shouldCreateSession = useSelector(selectShouldCreateQrSyncSession);
  const isQrSyncTerminal = useSelector(selectIsQrSyncTerminal);
  const [isExiting, setIsExiting] = useState(false);
  const [password, setPassword] = useState<string | undefined>();

  useEffect(() => {
    if (!shouldCreateSession || isExiting) {
      return;
    }

    const createQrSyncSession = async () => {
      await submitRequestToBackground<void>('messengerCall', [
        'QrSyncController:createSession',
        [],
      ]).catch(() => undefined);
    };

    createQrSyncSession();
  }, [isExiting, shouldCreateSession]);

  useEffect(() => {
    if (qrSyncPhase === QR_SYNC_PHASES.REVIEWING_SYNC_OFFER) {
      return;
    }

    setPassword(undefined);
  }, [qrSyncPhase]);

  const resetQrSyncState = useCallback(async () => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:resetState',
      [],
    ]).catch(() => undefined);
  }, []);

  const handleExit = useCallback(async () => {
    setIsExiting(true);
    await resetQrSyncState();
    navigate(DEFAULT_ROUTE);
  }, [navigate, resetQrSyncState]);

  useEffect(() => {
    if (!isQrSyncTerminal) {
      return;
    }

    handleExit().catch(() => undefined);
  }, [handleExit, isQrSyncTerminal]);

  const handleAddWallets = useCallback(async (entropyIds: string[]) => {
    if (!password) {
      throw new Error('Password is required before syncing accounts.');
    }

    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:syncAccounts',
      [password, entropyIds],
    ]);
  }, [password]);

  const renderStep = () => {
    switch (qrSyncPhase) {
      case QR_SYNC_PHASES.IDLE:
      case QR_SYNC_PHASES.DISPLAYING_QR:
        return <QrCodeScan />;
      case QR_SYNC_PHASES.AWAITING_OTP_INPUT:
        return <EnterVerificationCode />;
      case QR_SYNC_PHASES.AWAITING_SYNC_OFFER:
        return (
          <LoadingStep
            title={`${t('add_device_validating_title')}...`}
            message={t('add_device_validating_desc')}
          />
        );
      case QR_SYNC_PHASES.REVIEWING_SYNC_OFFER:
        return password ? (
          <AddWallets onAddWallets={handleAddWallets} />
        ) : (
          <EnterPassword onPasswordChange={setPassword} />
        );
      case QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION:
        return (
          <LoadingStep
            title={`${t('add_device_syncing_title')}...`}
            message={t('add_device_syncing_desc')}
          />
        );
      case QR_SYNC_PHASES.COMPLETED:
        return <Success onDone={() => handleExit().catch(() => undefined)} />;
      case QR_SYNC_PHASES.CANCELLED:
      case QR_SYNC_PHASES.FAILED:
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default AddDeviceSettings;
