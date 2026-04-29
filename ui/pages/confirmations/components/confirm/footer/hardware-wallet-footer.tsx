import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback, useEffect, useMemo } from 'react';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import {
  Button,
  ButtonSize,
} from '../../../../../components/component-library';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import {
  ConnectionStatus,
  HardwareWalletType,
  useHardwareFooter,
  useHardwareWalletError,
  useHardwareWalletState,
} from '../../../../../contexts/hardware-wallets';
import { ConfirmButton } from './confirm-button';
import { useConfirmationSubmit } from './useConfirmationSubmit';
import type { ResolvePendingApprovalOptions } from './useConfirmationSubmit';

export const HardwareWalletActionButton = ({
  buttonText,
  disabled,
  isLoading = false,
}: {
  buttonText?: string;
  disabled: boolean;
  isLoading?: boolean;
}) => {
  const { navigateNext } = useConfirmationNavigation();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const currentConfirmationId = currentConfirmation?.id;
  const t = useI18nContext();

  const { onCancel } = useConfirmActions();
  const { hasUnconfirmedDangerAlerts } = useAlerts(
    currentConfirmation?.id ?? '',
  );

  const { dismissErrorModal, setErrorModalSuppressed, isErrorModalVisible } =
    useHardwareWalletError();

  const onUserRejectedHardwareWalletError = useCallback(async () => {
    // User intentionally rejected on device; follow the cancel flow.
    await onCancel({
      location: MetaMetricsEventLocation.Confirmation,
    });
    dismissErrorModal();
    if (currentConfirmationId) {
      navigateNext(currentConfirmationId);
    }
  }, [currentConfirmationId, navigateNext, onCancel, dismissErrorModal]);

  const {
    walletType,
    shouldRunHardwareWalletPreflight,
    isHardwareWalletReady,
    onSubmitPreflightCheck,
    withHardwareWalletModalHandling,
  } = useHardwareFooter({
    currentConfirmation,
    currentConfirmationId,
    onUserRejectedHardwareWalletError,
  });

  const { connectionState } = useHardwareWalletState();

  useEffect(() => {
    const shouldSuppressHardwareWalletErrors =
      hasUnconfirmedDangerAlerts && shouldRunHardwareWalletPreflight;

    setErrorModalSuppressed(shouldSuppressHardwareWalletErrors);
  }, [
    hasUnconfirmedDangerAlerts,
    setErrorModalSuppressed,
    shouldRunHardwareWalletPreflight,
  ]);

  const isQrWallet = walletType === HardwareWalletType.Qr;

  const isNotReady = ![
    ConnectionStatus.Connected,
    ConnectionStatus.Ready,
  ].includes(connectionState.status);

  const shouldShowReconnectButton =
    shouldRunHardwareWalletPreflight &&
    !isHardwareWalletReady &&
    !hasUnconfirmedDangerAlerts &&
    !isQrWallet &&
    isNotReady &&
    !isErrorModalVisible;

  const onReconnectHardwareWalletCta = useCallback(async () => {
    await onSubmitPreflightCheck({ trackConnectCta: true });
  }, [onSubmitPreflightCheck]);

  const beforeSubmit = useCallback(async () => {
    if (shouldRunHardwareWalletPreflight) {
      const isReady = await onSubmitPreflightCheck();
      if (!isReady) {
        return false;
      }
    }

    return true;
  }, [onSubmitPreflightCheck, shouldRunHardwareWalletPreflight]);

  const resolveApprovalOptions = useMemo<
    Omit<ResolvePendingApprovalOptions, 'fromAddress'>
  >(
    () =>
      walletType
        ? {
            waitForResult: true,
            walletType,
          }
        : {},
    [walletType],
  );

  const onSubmit = useConfirmationSubmit({
    beforeSubmit,
    resolveApprovalOptions,
    withResolvePendingApproval: withHardwareWalletModalHandling,
  });

  if (shouldShowReconnectButton) {
    return (
      <Button
        block
        data-testid="reconnect-hardware-wallet-button"
        onClick={onReconnectHardwareWalletCta}
        size={ButtonSize.Lg}
      >
        {walletType
          ? t('connectHardwareDevice', [t(walletType)])
          : t('connect')}
      </Button>
    );
  }

  return (
    <ConfirmButton
      alertOwnerId={currentConfirmation?.id}
      buttonText={buttonText}
      onSubmit={onSubmit}
      disabled={disabled}
      isLoading={isLoading}
      onCancel={onCancel}
    />
  );
};
