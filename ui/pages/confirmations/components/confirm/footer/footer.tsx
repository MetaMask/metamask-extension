import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { clearConfirmTransaction } from '../../../../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  Display,
  FlexDirection,
  Severity,
} from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import {
  rejectPendingApproval,
  resolvePendingApproval,
  setNextNonce,
  updateCustomNonce,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useConfirmSendNavigation } from '../../../hooks/useConfirmSendNavigation';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { isSignatureTransactionType } from '../../../utils';
import { useTransactionConfirm } from '../../../hooks/transactions/useTransactionConfirm';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import { getConfirmationSender } from '../utils';
import OriginThrottleModal from './origin-throttle-modal';

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
          {t('confirm')}
        </Button>
      )}
    </>
  );
};

const Footer = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { onTransactionConfirm } = useTransactionConfirm();

  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext<TransactionMeta>();

  const { isGaslessLoading } = useIsGaslessLoading();
  const { navigateBackIfSend } = useConfirmSendNavigation();

  const { from } = getConfirmationSender(currentConfirmation);
  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { id: currentConfirmationId } = currentConfirmation || {};

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      const inE2e =
        process.env.IN_TEST && process.env.JEST_WORKER_ID === 'undefined';
      return inE2e ? false : doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const isSignature = isSignatureTransactionType(currentConfirmation);

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) ||
    hardwareWalletRequiresConnection ||
    isGaslessLoading;

  const rejectApproval = useCallback(
    ({ location }: { location?: MetaMetricsEventLocation } = {}) => {
      if (!currentConfirmationId) {
        return;
      }

      const error = providerErrors.userRejectedRequest();
      error.data = { location };

      const serializedError = serializeError(error);
      dispatch(rejectPendingApproval(currentConfirmationId, serializedError));
    },
    [currentConfirmationId, dispatch],
  );

  const resetTransactionState = useCallback(() => {
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
    dispatch(clearConfirmTransaction());
  }, [dispatch]);

  const onCancel = useCallback(
    ({ location }: { location?: MetaMetricsEventLocation }) => {
      if (!currentConfirmation) {
        return;
      }

      navigateBackIfSend();
      rejectApproval({ location });
      resetTransactionState();
    },
    [
      currentConfirmation,
      navigateBackIfSend,
      rejectApproval,
      resetTransactionState,
    ],
  );

  const onSubmit = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }

    const isTransactionConfirmation = isCorrectDeveloperTransactionType(
      currentConfirmation?.type,
    );

    if (isTransactionConfirmation) {
      onTransactionConfirm();
    } else {
      dispatch(resolvePendingApproval(currentConfirmation.id, undefined));
    }
    resetTransactionState();
  }, [
    currentConfirmation,
    dispatch,
    onTransactionConfirm,
    resetTransactionState,
  ]);

  const handleFooterCancel = useCallback(() => {
    if (shouldThrottleOrigin) {
      setShowOriginThrottleModal(true);
      return;
    }
    onCancel({ location: MetaMetricsEventLocation.Confirmation });
  }, [onCancel, shouldThrottleOrigin]);

  return (
    <PageFooter
      className="confirm-footer_page-footer"
      flexDirection={FlexDirection.Column}
    >
      <OriginThrottleModal
        isOpen={showOriginThrottleModal}
        onConfirmationCancel={onCancel}
      />
      <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
        <Button
          block
          data-testid="confirm-footer-cancel-button"
          onClick={handleFooterCancel}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
        >
          {t('cancel')}
        </Button>
        <ConfirmButton
          alertOwnerId={currentConfirmation?.id}
          onSubmit={() => onSubmit()}
          disabled={isConfirmDisabled}
          onCancel={onCancel}
        />
      </Box>
    </PageFooter>
  );
};

export default Footer;
