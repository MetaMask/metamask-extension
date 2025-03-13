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
import {
  doesAddressRequireLedgerHidConnection,
  getCustomNonceValue,
} from '../../../../../selectors';
import {
  rejectPendingApproval,
  resolvePendingApproval,
  setNextNonce,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  updateAndApproveTx,
  ///: END:ONLY_INCLUDE_IF
  updateCustomNonce,
} from '../../../../../store/actions';
import { useConfirmContext } from '../../../context/confirm';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { isSignatureTransactionType } from '../../../utils';
import { getConfirmationSender } from '../utils';
import { useIsUpgradeTransaction } from '../info/hooks/useIsUpgradeTransaction';
import { UpgradeCancelModal } from './upgrade-cancel-modal';
import OriginThrottleModal from './origin-throttle-modal';
import { Acknowledge } from './acknowledge';

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
  const customNonceValue = useSelector(getCustomNonceValue);
  const [isUpgradeCancelModalOpen, setUpgradeCancelModalOpen] = useState(false);

  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext<TransactionMeta>();

  const { from } = getConfirmationSender(currentConfirmation);
  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { id: currentConfirmationId } = currentConfirmation || {};

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isUpgradeTransaction = useIsUpgradeTransaction();
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const isAcknowledgeRequired = isUpgradeTransaction;

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) ||
    hardwareWalletRequiresConnection ||
    (isAcknowledgeRequired && !isAcknowledged);

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
    [currentConfirmationId],
  );

  const resetTransactionState = () => {
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
    dispatch(clearConfirmTransaction());
  };

  const onCancel = useCallback(
    ({ location }: { location?: MetaMetricsEventLocation }) => {
      if (!currentConfirmation) {
        return;
      }

      if (isUpgradeTransaction) {
        setUpgradeCancelModalOpen(true);
        return;
      }

      rejectApproval({ location });
      resetTransactionState();
    },
    [currentConfirmation, isUpgradeTransaction],
  );

  const onSubmit = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }

    const isTransactionConfirmation = isCorrectDeveloperTransactionType(
      currentConfirmation?.type,
    );

    if (isTransactionConfirmation) {
      const mergeTxDataWithNonce = (transactionData: TransactionMeta) =>
        customNonceValue
          ? {
              ...transactionData,
              customNonceValue,
            }
          : transactionData;

      const updatedTx = mergeTxDataWithNonce(
        currentConfirmation as TransactionMeta,
      );
      ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
      dispatch(updateAndApproveTx(updatedTx, true, ''));
      ///: END:ONLY_INCLUDE_IF
    } else {
      dispatch(resolvePendingApproval(currentConfirmation.id, undefined));
    }
    resetTransactionState();
  }, [currentConfirmation, customNonceValue]);

  const handleFooterCancel = useCallback(() => {
    if (shouldThrottleOrigin) {
      setShowOriginThrottleModal(true);
      return;
    }
    onCancel({ location: MetaMetricsEventLocation.Confirmation });
  }, [currentConfirmation, onCancel]);

  return (
    <PageFooter
      className="confirm-footer_page-footer"
      flexDirection={FlexDirection.Column}
    >
      <OriginThrottleModal
        isOpen={showOriginThrottleModal}
        onConfirmationCancel={onCancel}
      />
      <UpgradeCancelModal
        isOpen={isUpgradeCancelModalOpen}
        onClose={() => setUpgradeCancelModalOpen(false)}
        onReject={rejectApproval}
      />
      <Acknowledge
        isAcknowledged={isAcknowledged}
        onAcknowledgeToggle={setIsAcknowledged}
      />
      <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
        <Button
          block
          data-testid="confirm-footer-cancel-button"
          onClick={handleFooterCancel}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          endIconName={isUpgradeTransaction ? IconName.ArrowDown : undefined}
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
