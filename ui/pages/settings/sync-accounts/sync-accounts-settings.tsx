import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../../store/background-connection';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  QR_SYNC_ERROR_PHASE_OVERRIDES,
  QR_SYNC_PHASES,
} from '../../../../shared/constants/qr-sync';
import {
  selectQrSyncError,
  selectQrSyncPhase,
} from '../../../selectors/qr-sync/qr-sync';
import {
  AddWallets,
  EnterPassword,
  EnterVerificationCode,
  LoadingStep,
  QrCodeScan,
  Success,
  SyncError,
} from './components';
import type { AddDeviceSyncRequest } from './types';

const SyncAccountsSettings = () => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const qrSyncPhase = useSelector(selectQrSyncPhase);
  const qrSyncError = useSelector(selectQrSyncError);
  const [isExiting, setIsExiting] = useState(false);
  const [password, setPassword] = useState<string | undefined>();
  const [syncSummary, setSyncSummary] = useState<Pick<
    AddDeviceSyncRequest,
    'syncedAccountCount' | 'syncedWalletCount'
  > | null>(null);

  const cancelQrSyncSession = useCallback(async () => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:cancelSync',
      [],
    ]).catch(() => undefined);
  }, []);

  const createQrSyncSession = useCallback(async () => {
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:createSession',
      [],
    ]).catch(() => undefined);
  }, []);

  const startNewSession = useCallback(async () => {
    await cancelQrSyncSession();
    await createQrSyncSession();
  }, [cancelQrSyncSession, createQrSyncSession]);

  useEffect(() => {
    if (isExiting) {
      return undefined;
    }

    let isActive = true;

    const initializeSession = async () => {
      await cancelQrSyncSession();
      if (!isActive || isExiting) {
        return;
      }

      await createQrSyncSession();
    };

    initializeSession();

    return () => {
      isActive = false;
      cancelQrSyncSession().catch(() => undefined);
    };
  }, [cancelQrSyncSession, createQrSyncSession, isExiting]);

  useEffect(() => {
    if (qrSyncPhase === QR_SYNC_PHASES.REVIEWING_SYNC_OFFER) {
      return;
    }

    setPassword(undefined);
  }, [qrSyncPhase]);

  const handleExit = useCallback(async () => {
    setIsExiting(true);
    await cancelQrSyncSession();
    navigate(DEFAULT_ROUTE);
  }, [cancelQrSyncSession, navigate]);

  const handleRetry = useCallback(() => {
    startNewSession().catch(() => undefined);
  }, [startNewSession]);

  const handleAddWallets = useCallback(
    async ({
      selectedAccountGroupIds,
      syncedAccountCount,
      syncedWalletCount,
    }: AddDeviceSyncRequest) => {
      if (!password) {
        throw new Error('Password is required before syncing accounts.');
      }

      setSyncSummary({ syncedAccountCount, syncedWalletCount });

      await submitRequestToBackground<void>('messengerCall', [
        'QrSyncController:syncAccounts',
        [password, selectedAccountGroupIds],
      ]);
    },
    [password],
  );

  const renderStep = () => {
    const effectivePhase =
      qrSyncError && QR_SYNC_ERROR_PHASE_OVERRIDES[qrSyncError.code]
        ? QR_SYNC_ERROR_PHASE_OVERRIDES[qrSyncError.code]
        : qrSyncPhase;

    switch (effectivePhase) {
      case QR_SYNC_PHASES.IDLE:
      case QR_SYNC_PHASES.DISPLAYING_QR:
        return <QrCodeScan onRestart={handleRetry} />;
      case QR_SYNC_PHASES.AWAITING_OTP_INPUT:
        return <EnterVerificationCode onRestart={handleRetry} />;
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
        return syncSummary ? (
          <Success
            importedAccountCount={syncSummary.syncedAccountCount}
            walletCount={syncSummary.syncedWalletCount}
            onDone={() => handleExit().catch(() => undefined)}
          />
        ) : null;
      case QR_SYNC_PHASES.CANCELLED:
      case QR_SYNC_PHASES.FAILED:
        return (
          <SyncError
            onRetry={handleRetry}
            onCancel={() => handleExit().catch(() => undefined)}
          />
        );
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default SyncAccountsSettings;
