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
  selectShouldCreateQrSyncSession,
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
  const shouldCreateSession = useSelector(selectShouldCreateQrSyncSession);
  const [isExiting, setIsExiting] = useState(false);
  const [password, setPassword] = useState<string | undefined>();
  const [syncSummary, setSyncSummary] = useState<Pick<
    AddDeviceSyncRequest,
    'syncedAccountCount' | 'syncedWalletCount'
  > | null>(null);

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

  const handleExit = useCallback(async () => {
    setIsExiting(true);

    // cancel the current sync session
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:cancelSync',
      [],
    ]).catch(() => undefined);

    // navigate to the default route
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

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
        return syncSummary ? (
          <Success
            importedAccountCount={syncSummary.syncedAccountCount}
            walletCount={syncSummary.syncedWalletCount}
            onDone={() => handleExit().catch(() => undefined)}
          />
        ) : null;
      case QR_SYNC_PHASES.CANCELLED:
      case QR_SYNC_PHASES.FAILED:
        return <SyncError />;
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default SyncAccountsSettings;
