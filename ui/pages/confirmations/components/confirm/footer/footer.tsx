import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
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
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { resolvePendingApproval } from '../../../../../store/actions';
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
import { getConfirmationSender } from '../utils';
import { useUserSubscriptions } from '../../../../../hooks/subscription/useSubscription';
import { useHardwareWalletError } from '../../../../../contexts/hardware-wallets';
import { useHardwareFooter } from './useHardwareFooter';
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
      {hasDangerAlerts ? (
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
  const { navigateNext } = useConfirmationNavigation();
  const { onSubmit: onAddEthereumChain } = useAddEthereumChain();

  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext<TransactionMeta>();
  const currentConfirmationId = currentConfirmation?.id;
  const t = useI18nContext();
  const { isGaslessLoading } = useIsGaslessLoading();

  const { from: fromAddress } = getConfirmationSender(currentConfirmation);
  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { onCancel, resetTransactionState } = useConfirmActions();

  const { dismissErrorModal } = useHardwareWalletError();

  const isAddEthereumChain = isAddEthereumChainType(currentConfirmation);
  const isTransactionConfirmation = isCorrectDeveloperTransactionType(
    currentConfirmation?.type,
  );
  const onUserRejectedHardwareWalletError = useCallback(async () => {
    // User intentionally rejected on device; follow the cancel flow.
    await onCancel({
      location: MetaMetricsEventLocation.Confirmation,
    });
    if (currentConfirmationId) {
      navigateNext(currentConfirmationId);
    }
  }, [currentConfirmationId, navigateNext, onCancel]);

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

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) || isGaslessLoading;

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
      } else if (isTransactionConfirmation) {
        const didConfirm = await onTransactionConfirm();
        if (didConfirm && currentConfirmationId) {
          navigateNext(currentConfirmationId);
        }
      } else {
        const resolveApprovalWithHardwareWalletHandling =
          withHardwareWalletModalHandling(async () => {
            await dispatch(
              resolvePendingApproval(currentConfirmation.id, undefined, {
                fromAddress,
              }),
            );

            if (currentConfirmationId) {
              navigateNext(currentConfirmationId);
            }
          });

        await resolveApprovalWithHardwareWalletHandling();
      }
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
    resetTransactionState,
    onTransactionConfirm,
    navigateNext,
    dispatch,
    fromAddress,
    withHardwareWalletModalHandling,
  ]);

  const handleFooterCancel = useCallback(async () => {
    if (shouldThrottleOrigin) {
      setShowOriginThrottleModal(true);
      return;
    }

    await onCancel({ location: MetaMetricsEventLocation.Confirmation });

    onDappSwapCompleted();
    dismissErrorModal();
    if (isAddEthereumChain) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    if (currentConfirmationId) {
      navigateNext(currentConfirmationId);
    }
  }, [
    navigateNext,
    onCancel,
    shouldThrottleOrigin,
    currentConfirmationId,
    isAddEthereumChain,
    navigate,
    onDappSwapCompleted,
    dismissErrorModal,
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
          {shouldRunHardwareWalletPreflight && !isHardwareWalletReady ? (
            <Button
              block
              data-testid="reconnect-hardware-wallet-button"
              onClick={onSubmitPreflightCheck}
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
              disabled={isConfirmDisabled}
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
