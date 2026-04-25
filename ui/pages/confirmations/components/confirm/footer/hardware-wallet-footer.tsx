import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import {
  Button,
  ButtonSize,
} from '../../../../../components/component-library';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { resolvePendingApproval } from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useTransactionConfirm } from '../../../hooks/transactions/useTransactionConfirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import {
  isAddEthereumChainType,
  useAddEthereumChain,
} from '../../../hooks/useAddEthereumChain';
import { getConfirmationSender } from '../utils';
import {
  useHardwareFooter,
  useHardwareWalletError,
} from '../../../../../contexts/hardware-wallets';
import { ConfirmButton } from './footer';

export const HardwareWalletActionButton = ({
  disabled,
}: {
  disabled: boolean;
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { onTransactionConfirm } = useTransactionConfirm();
  const { navigateNext } = useConfirmationNavigation();
  const { onSubmit: onAddEthereumChain } = useAddEthereumChain();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const currentConfirmationId = currentConfirmation?.id;
  const t = useI18nContext();

  const { from: fromAddress } = getConfirmationSender(currentConfirmation);
  const { onCancel, resetTransactionState } = useConfirmActions();
  const { hasUnconfirmedDangerAlerts } = useAlerts(
    currentConfirmation?.id ?? '',
  );

  const { dismissErrorModal, setErrorModalSuppressed } =
    useHardwareWalletError();

  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );
  const isAddEthereumChain = isAddEthereumChainType(currentConfirmation);

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

  useEffect(() => {
    const shouldSuppressHardwareWalletErrors =
      hasUnconfirmedDangerAlerts && shouldRunHardwareWalletPreflight;

    setErrorModalSuppressed(shouldSuppressHardwareWalletErrors);
  }, [
    hasUnconfirmedDangerAlerts,
    setErrorModalSuppressed,
    shouldRunHardwareWalletPreflight,
  ]);

  const shouldShowReconnectButton =
    shouldRunHardwareWalletPreflight &&
    !isHardwareWalletReady &&
    !hasUnconfirmedDangerAlerts;

  const onReconnectHardwareWalletCta = useCallback(async () => {
    await onSubmitPreflightCheck({ trackConnectCta: true });
  }, [onSubmitPreflightCheck]);

  const onSubmit = useCallback(async () => {
    if (!currentConfirmation) {
      return;
    }

    if (shouldRunHardwareWalletPreflight) {
      const isReady = await onSubmitPreflightCheck();
      if (!isReady) {
        return;
      }
    }

    try {
      if (isAddEthereumChain) {
        await onAddEthereumChain();
        navigate(DEFAULT_ROUTE);
        return;
      }

      if (isTransactionConfirmation) {
        const didConfirm = await onTransactionConfirm();
        if (didConfirm && currentConfirmationId) {
          navigateNext(currentConfirmationId);
        }
        return;
      }

      const resolveApprovalWithHardwareWalletHandling =
        withHardwareWalletModalHandling(async () => {
          const resolveApprovalOptions = walletType
            ? {
                fromAddress,
                waitForResult: true,
                walletType,
              }
            : {
                fromAddress,
              };

          await dispatch(
            resolvePendingApproval(currentConfirmation.id, undefined, {
              ...resolveApprovalOptions,
            }),
          );

          if (currentConfirmationId) {
            navigateNext(currentConfirmationId);
          }
        });

      await resolveApprovalWithHardwareWalletHandling();
    } finally {
      resetTransactionState();
    }
  }, [
    currentConfirmation,
    currentConfirmationId,
    onSubmitPreflightCheck,
    shouldRunHardwareWalletPreflight,
    isAddEthereumChain,
    isTransactionConfirmation,
    onAddEthereumChain,
    navigate,
    onTransactionConfirm,
    navigateNext,
    dispatch,
    fromAddress,
    walletType,
    withHardwareWalletModalHandling,
    resetTransactionState,
  ]);

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
      onSubmit={onSubmit}
      disabled={disabled}
      onCancel={onCancel}
    />
  );
};
