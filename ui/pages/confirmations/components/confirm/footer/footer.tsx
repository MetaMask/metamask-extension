import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { useNavigate } from 'react-router-dom';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import { ConfirmAlertModal } from '../../../../../components/app/alert-system/confirm-alert-modal';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  Display,
  FlexDirection,
  Severity,
} from '../../../../../helpers/constants/design-system';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../../../helpers/constants/routes';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getPendingHardwareSigning } from '../../../../../selectors';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import {
  resolvePendingApproval,
  setPendingHardwareSigning,
  closeCurrentNotificationWindow,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import { useEnableShieldCoverageChecks } from '../../../hooks/transactions/useEnableShieldCoverageChecks';
import { useTransactionConfirm } from '../../../hooks/transactions/useTransactionConfirm';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useDappSwapActions } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapActions';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import {
  isAddEthereumChainType,
  useAddEthereumChain,
} from '../../../hooks/useAddEthereumChain';
import { isSignatureTransactionType } from '../../../utils';
import { SignatureRequestType } from '../../../types/confirm';
import { useUserSubscriptions } from '../../../../../hooks/subscription/useSubscription';
import {
  ConnectionStatus,
  useHardwareWalletActions,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletError,
  isUserRejectedHardwareWalletError,
  isRetryableHardwareWalletError,
  isHardwareWalletError,
} from '../../../../../contexts/hardware-wallets';
import OriginThrottleModal from './origin-throttle-modal';
import ShieldFooterAgreement from './shield-footer-agreement';
import ShieldFooterCoverageIndicator from './shield-footer-coverage-indicator/shield-footer-coverage-indicator';

export type OnCancelHandler = ({
  location,
}: {
  location: MetaMetricsEventLocation;
}) => void;

function reviewAlertButtonText(
  unconfirmedDangerAlerts: Alert[],
  t: ReturnType<typeof useI18nContext>,
) {
  if (unconfirmedDangerAlerts.length === 1) {
    return t('reviewAlert');
  }

  if (unconfirmedDangerAlerts.length > 1) {
    return t('reviewAlerts');
  }

  return t('confirm');
}

function getButtonDisabledState(
  hasUnconfirmedDangerAlerts: boolean,
  hasBlockingAlerts: boolean,
  disabled: boolean,
) {
  if (hasBlockingAlerts) {
    return true;
  }

  if (hasUnconfirmedDangerAlerts) {
    return false;
  }

  return disabled;
}

const ConfirmButton = ({
  alertOwnerId = '',
  disabled,
  onSubmit,
  onCancel,
}: {
  alertOwnerId?: string;
  disabled: boolean;
  onSubmit: () => void;
  onCancel: OnCancelHandler;
}) => {
  const t = useI18nContext();

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);

  const {
    alerts,
    hasDangerAlerts,
    hasUnconfirmedDangerAlerts,
    hasUnconfirmedFieldDangerAlerts,
    unconfirmedFieldDangerAlerts,
  } = useAlerts(alertOwnerId);

  const hasDangerBlockingAlerts = alerts.some(
    (alert) => alert.severity === Severity.Danger && alert.isBlocking,
  );

  const handleCloseConfirmModal = useCallback(() => {
    setConfirmModalVisible(false);
  }, []);

  const handleOpenConfirmModal = useCallback(() => {
    setConfirmModalVisible(true);
  }, []);

  const { trialedProducts } = useUserSubscriptions();
  const isShieldTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);

  return (
    <>
      {confirmModalVisible && (
        <ConfirmAlertModal
          ownerId={alertOwnerId}
          onClose={handleCloseConfirmModal}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
      {false ? (
        <Button
          block
          danger
          data-testid="confirm-footer-button"
          disabled={getButtonDisabledState(
            hasUnconfirmedDangerAlerts,
            hasDangerBlockingAlerts,
            disabled,
          )}
          onClick={handleOpenConfirmModal}
          size={ButtonSize.Lg}
          startIconName={
            hasUnconfirmedFieldDangerAlerts
              ? IconName.SecuritySearch
              : IconName.Danger
          }
        >
          {reviewAlertButtonText(unconfirmedFieldDangerAlerts, t)}
        </Button>
      ) : (
        <Button
          block
          data-testid="confirm-footer-button"
          disabled={disabled}
          onClick={onSubmit}
          size={ButtonSize.Lg}
        >
          {currentConfirmation?.type ===
          TransactionType.shieldSubscriptionApprove
            ? t(
                isShieldTrialed
                  ? 'shieldStartNowCTA'
                  : 'shieldStartNowCTAWithTrial',
              )
            : t('confirm')}
        </Button>
      )}
    </>
  );
};

const CancelButton = ({
  handleFooterCancel,
}: {
  handleFooterCancel: () => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  if (currentConfirmation?.type === TransactionType.shieldSubscriptionApprove) {
    return null;
  }

  return (
    <Button
      block
      data-testid="confirm-footer-cancel-button"
      onClick={handleFooterCancel}
      size={ButtonSize.Lg}
      variant={ButtonVariant.Secondary}
    >
      {t('cancel')}
    </Button>
  );
};

const Footer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { onDappSwapCompleted } = useDappSwapActions();
  const { onTransactionConfirm } = useTransactionConfirm();
  const { navigateNext, count: confirmationsCount } =
    useConfirmationNavigation();
  const { onSubmit: onAddEthereumChain } = useAddEthereumChain();

  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext<TransactionMeta>();
  const t = useI18nContext();
  const { isGaslessLoading } = useIsGaslessLoading();
  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { onCancel, resetTransactionState } = useConfirmActions();

  const { connectionState } = useHardwareWalletState();
  const { isHardwareWalletAccount, deviceId, walletType } =
    useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const { showErrorModal } = useHardwareWalletError();

  const isHardwareWalletSigning = useSelector(getPendingHardwareSigning);

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );
  const isAddEthereumChain = isAddEthereumChainType(currentConfirmation);

  const isHardwareWalletReady = useMemo(() => {
    return (
      isHardwareWalletAccount &&
      [ConnectionStatus.Connected, ConnectionStatus.Ready].includes(
        connectionState.status,
      )
    );
  }, [isHardwareWalletAccount, connectionState.status]);

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) || isGaslessLoading;

  const onSubmitPreflightCheck = useCallback(async (): Promise<boolean> => {
    if (!isHardwareWalletAccount) {
      return true;
    }

    // if (!deviceId) {
    //   console.log('[Footer] No device ID available');
    //   return false;
    // }

    console.log(
      '[Hardware debug Footer] Verifying hardware wallet device is ready',
      {
        deviceId,
        isHardwareWalletAccount,
      },
    );
    const isDeviceReady = await ensureDeviceReady(deviceId || '');
    console.log('[Hardware debug Footer] ensureDeviceReady result:', {
      isDeviceReady,
      deviceId,
    });

    if (!isDeviceReady) {
      console.log(
        '[Hardware debug Footer] Device not ready - HardwareWalletErrorMonitor will show error modal automatically',
      );
      return false;
    }

    console.log('[Hardware debug Footer] Device is ready');
    return true;
  }, [isHardwareWalletAccount, deviceId, ensureDeviceReady]);

  const onSubmit = useCallback(async () => {
    if (!currentConfirmation) {
      return;
    }

    // const isReady = await onSubmitPreflightCheck();
    // if (!isReady) {
    //   return;
    // }

    if (isAddEthereumChain) {
      await onAddEthereumChain();
      navigate(DEFAULT_ROUTE);
      resetTransactionState();
    } else if (
      isTransactionConfirmation ||
      (!isSignature && isHardwareWalletAccount)
    ) {
      // Use the transaction confirm hook for:
      // 1. Redesign transaction types (any account type)
      // 2. Non-signature transactions on hardware wallet accounts
      //
      // Hardware wallet TRANSACTIONS must use this path to ensure proper
      // signing and error handling via approveHardwareTransaction.
      // Hardware wallet SIGNATURES use resolvePendingApproval since signature
      // signing is handled at the keyring level.
      console.log('[Footer onSubmit] Using onTransactionConfirm:', {
        isTransactionConfirmation,
        isSignature,
        isHardwareWalletAccount,
      });
      await onTransactionConfirm();
    } else {
      // Signatures and other non-transaction approvals
      // Get the from address for hardware wallet detection
      const fromAddress =
        (currentConfirmation as SignatureRequestType).msgParams?.from ??
        (currentConfirmation as TransactionMeta).txParams?.from;

      try {
        await dispatch(
          resolvePendingApproval(currentConfirmation.id, undefined, {
            fromAddress,
          }),
        );
        navigateNext(currentConfirmation.id);
        resetTransactionState();
      } catch (error) {
        // Handle hardware wallet errors from resolveHardwareApproval
        console.log(
          '[Footer onSubmit] Error from resolvePendingApproval:',
          error,
        );

        // Use isHardwareWalletError which handles duck typing for errors
        // that lost their class type over the RPC boundary
        if (!isHardwareWalletError(error)) {
          // Non-hardware wallet error - rethrow
          throw error;
        }

        // User rejection: The user deliberately rejected on the hardware wallet device.
        // The approval has already been processed (and removed) by the signature controller
        // via `accept`, so we don't need to call rejectPendingApproval.
        // We just need to:
        // 1. Clear pendingHardwareSigning so closeCurrentNotificationWindow isn't blocked
        // 2. Close the popup directly
        if (isUserRejectedHardwareWalletError(error)) {
          console.log(
            '[Footer onSubmit] User rejection - clearing flag and closing popup',
          );

          // Clear pendingHardwareSigning and close the popup directly.
          // The approval is already gone (processed by accept with an error result),
          // so rejectPendingApproval would do nothing useful.
          dispatch(setPendingHardwareSigning(false));
          dispatch(closeCurrentNotificationWindow());
          return;
        }

        // Retryable errors (device locked, app closed): Show modal for retry
        if (isRetryableHardwareWalletError(error)) {
          // Extract metadata using duck typing to handle different error structures:
          // 1. HardwareWalletError instance: error.metadata.recreatedSignatureId
          // 2. RPC error: error.data.metadata.recreatedSignatureId
          const errorObj = error as {
            metadata?: Record<string, unknown>;
            data?: { metadata?: Record<string, unknown> };
          };
          const errorMetadata = errorObj?.metadata ?? errorObj?.data?.metadata;
          const recreatedSignatureId = errorMetadata?.recreatedSignatureId as
            | string
            | undefined;

          console.log(
            '[Footer onSubmit] Retryable error - showing modal for retry',
            {
              error,
              errorMetadata,
              recreatedSignatureId,
            },
          );

          // Clear pendingHardwareSigning so the confirm button is enabled for retry
          dispatch(setPendingHardwareSigning(false));

          // Show the error modal first
          showErrorModal(error);

          // If a new signature request was created, navigate to it
          if (recreatedSignatureId) {
            console.log(
              '[Footer onSubmit] Navigating to recreated signature:',
              recreatedSignatureId,
            );
            // Note: SIGNATURE_REQUEST_PATH already starts with '/', so no extra slash needed
            navigate(
              `${CONFIRM_TRANSACTION_ROUTE}/${recreatedSignatureId}${SIGNATURE_REQUEST_PATH}`,
              {
                replace: true,
              },
            );
          }
          return;
        }

        // Other non-retryable hardware wallet errors: Show modal
        console.log('[Footer onSubmit] Non-retryable error - showing modal');
        showErrorModal(error);
      }
    }
  }, [
    isAddEthereumChain,
    isTransactionConfirmation,
    isSignature,
    isHardwareWalletAccount,
    resetTransactionState,
    onAddEthereumChain,
    navigate,
    onTransactionConfirm,
    navigateNext,
    currentConfirmation,
    dispatch,
    showErrorModal,
  ]);

  const handleFooterCancel = useCallback(async () => {
    console.log('[Footer handleFooterCancel] Starting cancel', {
      confirmationsCount,
      currentConfirmationId: currentConfirmation?.id,
      isAddEthereumChain,
      shouldThrottleOrigin,
    });

    if (shouldThrottleOrigin) {
      setShowOriginThrottleModal(true);
      return;
    }

    await onCancel({ location: MetaMetricsEventLocation.Confirmation });

    console.log('[Footer handleFooterCancel] After onCancel, navigating...');

    onDappSwapCompleted();

    // After rejection, navigate to the next confirmation or home
    // confirmationsCount includes the current one, so if it's 1 or less, go home
    if (isAddEthereumChain || confirmationsCount <= 1) {
      console.log('[Footer handleFooterCancel] Navigating to DEFAULT_ROUTE');
      navigate(DEFAULT_ROUTE);
    } else if (currentConfirmation?.id) {
      // Navigate to the next pending confirmation
      console.log(
        '[Footer handleFooterCancel] Navigating to next confirmation',
      );
      navigateNext(currentConfirmation.id);
    } else {
      // Fallback: if somehow no confirmation ID, go home
      console.log('[Footer handleFooterCancel] Fallback: Navigating to home');
      navigate(DEFAULT_ROUTE);
    }
  }, [
    navigateNext,
    onCancel,
    shouldThrottleOrigin,
    currentConfirmation?.id,
    isAddEthereumChain,
    navigate,
    onDappSwapCompleted,
    confirmationsCount,
  ]);

  const { isShowCoverageIndicator } = useEnableShieldCoverageChecks();

  if (!currentConfirmation) {
    return null;
  }

  return (
    <>
      <ShieldFooterCoverageIndicator />
      <PageFooter
        className="confirm-footer_page-footer"
        flexDirection={FlexDirection.Column}
        // box shadow to match the original var(--shadow-size-md) on the footer,
        // but only applied to the bottom of the box, so it doesn't overlap with
        // the shield footer coverage indicator
        style={
          isShowCoverageIndicator
            ? { boxShadow: '0 4px 16px -8px var(--color-shadow-default)' }
            : undefined
        }
      >
        <OriginThrottleModal
          isOpen={showOriginThrottleModal}
          onConfirmationCancel={onCancel}
        />
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
          <CancelButton handleFooterCancel={handleFooterCancel} />
          {isHardwareWalletAccount && !isHardwareWalletReady ? (
            <Button
              block
              data-testid="reconnect-hardware-wallet-button"
              onClick={onSubmit}
              size={ButtonSize.Lg}
            >
              {walletType
                ? t('connectHardwareDevice', [t(walletType)])
                : t('connect')}
            </Button>
          ) : (
            <ConfirmButton
              alertOwnerId={currentConfirmation?.id}
              onSubmit={onSubmit}
              disabled={isConfirmDisabled || isHardwareWalletSigning}
              onCancel={onCancel}
            />
          )}
        </Box>
        <ShieldFooterAgreement />
      </PageFooter>
    </>
  );
};

export default Footer;
