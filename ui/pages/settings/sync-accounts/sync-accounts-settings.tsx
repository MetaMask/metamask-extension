import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [passwordState, setPasswordState] = useState<{
    phase: typeof qrSyncPhase;
    value: string | undefined;
  }>({ phase: qrSyncPhase, value: undefined });
  const password =
    qrSyncPhase === QR_SYNC_PHASES.REVIEWING_SYNC_OFFER &&
    passwordState.phase === qrSyncPhase
      ? passwordState.value
      : undefined;
  const setPassword = useCallback(
    (value: string | undefined) => {
      setPasswordState({ phase: qrSyncPhase, value });
    },
    [qrSyncPhase],
  );
  const [syncSummary, setSyncSummary] = useState<Pick<
    AddDeviceSyncRequest,
    'syncedAccountCount' | 'syncedWalletCount'
  > | null>(null);

  const cancelQrSyncSession = useCallback(async () => {
    await submitRequestToBackground('QrSyncController:cancelSync', []).catch(
      () => undefined,
    );
  }, []);

  const createQrSyncSession = useCallback(async () => {
    await submitRequestToBackground('QrSyncController:createSession', []).catch(
      () => undefined,
    );
  }, []);

  const startNewSession = useCallback(async () => {
    await cancelQrSyncSession();
    await createQrSyncSession();
  }, [cancelQrSyncSession, createQrSyncSession]);

  const isIdle = qrSyncPhase === QR_SYNC_PHASES.IDLE;
  const hasRequestedSessionRef = useRef(false);

  useEffect(() => {
    if (isExiting || (hasRequestedSessionRef.current && !isIdle)) {
      return;
    }

    hasRequestedSessionRef.current = true;
    createQrSyncSession();
  }, [createQrSyncSession, isExiting, isIdle]);

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

      await submitRequestToBackground('QrSyncController:syncAccounts', [
        password,
        selectedAccountGroupIds,
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
          <EnterVerificationCode onRestart={handleRetry} isAwaitingSyncOffer />
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
            title={t('add_device_syncing_title')}
            message={t('add_device_syncing_desc')}
          />
        );
      case QR_SYNC_PHASES.COMPLETED:
        // Another open surface may not have submitted the import itself, so it
        // has no local summary. It still needs the Done action because the back
        // button is hidden once the import has been submitted.
        return (
          <Success
            importedAccountCount={syncSummary?.syncedAccountCount ?? 0}
            walletCount={syncSummary?.syncedWalletCount ?? 0}
            onDone={() => handleExit().catch(() => undefined)}
          />
        );
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
