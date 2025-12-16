import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
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
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import { useEnableShieldCoverageChecks } from '../../../hooks/transactions/useEnableShieldCoverageChecks';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { isAddEthereumChainType } from '../../../hooks/useAddEthereumChain';
import { isSignatureTransactionType } from '../../../utils';
import { getConfirmationSender } from '../utils';
import { useUserSubscriptions } from '../../../../../hooks/subscription/useSubscription';
import { useConfirmationSubmit } from '../../../hooks/useConfirmationSubmit';
import OriginThrottleModal from './origin-throttle-modal';
import ShieldFooterAgreement from './shield-footer-agreement';
import ShieldFooterCoverageIndicator from './shield-footer-coverage-indicator/shield-footer-coverage-indicator';
import { setHardwareSigningState } from '../../../../../store/actions';
import { isAddressLedger } from '../../../../../ducks/metamask/metamask';

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
  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext<TransactionMeta>();

  const { isGaslessLoading } = useIsGaslessLoading();
  const { from } = getConfirmationSender(currentConfirmation);
  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { onCancel, resetTransactionState } = useConfirmActions();
  const { submit } = useConfirmationSubmit();
  const { navigateNext } = useConfirmationNavigation();
  const dispatch = useDispatch();
  const isLedgerAccount = useSelector(
    (state) => from && isAddressLedger(state, from),
  );

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      const inE2e =
        process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined';
      return inE2e ? false : doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isAddEthereumChain = isAddEthereumChainType(currentConfirmation);

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) ||
    hardwareWalletRequiresConnection ||
    isGaslessLoading;

  const onSubmit = useCallback(async () => {
    console.log(
      '[Footer onSubmit] Starting, isLedgerAccount:',
      isLedgerAccount,
      'from:',
      from,
    );
    if (from && isLedgerAccount) {
      console.log('[Footer onSubmit] Setting hardware signing state...');
      await dispatch(
        setHardwareSigningState(from, 'ledger', currentConfirmation.id),
      );
      console.log('[Footer onSubmit] Hardware signing state set');
    }
    console.log('[Footer onSubmit] Calling submit()...');
    const { success, retryable } = await submit();
    console.log('[Footer onSubmit] Submit completed:', { success, retryable });
    debugger;
    // For Ledger accounts, keep the request alive to show signing status
    if (!isLedgerAccount && (success || !retryable)) {
      resetTransactionState();
    }

    // Only clear hardware signing state on failure or if not retryable
    if (isLedgerAccount && !success && !retryable) {
      await dispatch(setHardwareSigningState(null));
    }
  }, [
    from,
    isLedgerAccount,
    submit,
    dispatch,
    currentConfirmation.id,
    resetTransactionState,
  ]);

  const handleFooterCancel = useCallback(async () => {
    if (shouldThrottleOrigin) {
      setShowOriginThrottleModal(true);
      return;
    }

    // Clear hardware signing state when cancelling
    if (isLedgerAccount) {
      await dispatch(setHardwareSigningState(null));
    }

    await onCancel({ location: MetaMetricsEventLocation.Confirmation });

    if (!isAddEthereumChain) {
      navigateNext(currentConfirmation.id);
    }
  }, [
    navigateNext,
    onCancel,
    shouldThrottleOrigin,
    currentConfirmation,
    isAddEthereumChain,
    isLedgerAccount,
    dispatch,
  ]);

  const { isShowCoverageIndicator } = useEnableShieldCoverageChecks();

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
          <ConfirmButton
            alertOwnerId={currentConfirmation?.id}
            onSubmit={onSubmit}
            disabled={isConfirmDisabled}
            onCancel={onCancel}
          />
        </Box>
        <ShieldFooterAgreement />
      </PageFooter>
    </>
  );
};

export default Footer;
