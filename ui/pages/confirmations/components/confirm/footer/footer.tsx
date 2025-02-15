import { TransactionMeta } from '@metamask/transaction-controller';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConfirmAlertModal } from '../../../../../components/app/alert-system/confirm-alert-modal';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  IconName,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  doesAddressRequireLedgerHidConnection,
  getCustomNonceValue,
} from '../../../../../selectors';

import useAlerts from '../../../../../hooks/useAlerts';
import {
  rejectPendingApproval,
  resolvePendingApproval,
  setNextNonce,
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  updateAndApproveTx,
  ///: END:ONLY_INCLUDE_IF
  updateCustomNonce,
} from '../../../../../store/actions';
import { isSignatureTransactionType } from '../../../utils';
import { useConfirmContext } from '../../../context/confirm';
import { getConfirmationSender } from '../utils';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlignItems,
  Display,
  FlexDirection,
  Severity,
} from '../../../../../helpers/constants/design-system';
import { isCorrectDeveloperTransactionType } from '../../../../../../shared/lib/confirmation.utils';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { UpgradeCancelModal } from './upgrade-cancel-modal/upgrade-cancel-modal';
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
  const customNonceValue = useSelector(getCustomNonceValue);
  const [isUpgradeCancelModalOpen, setUpgradeCancelModalOpen] = useState(false);

  const { currentConfirmation, isScrollToBottomCompleted } =
    useConfirmContext<TransactionMeta>();

  const { from } = getConfirmationSender(currentConfirmation);
  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { id: currentConfirmationId } = currentConfirmation || {};

  const isUpgrade = Boolean(
    currentConfirmation?.txParams?.authorizationList?.length,
  );

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const [isUpgradeAcknowledged, setIsUpgradeAcknowledged] = useState(false);

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) ||
    hardwareWalletRequiresConnection ||
    (isUpgrade && !isUpgradeAcknowledged);

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

  const onCancel = useCallback(
    ({ location }: { location?: MetaMetricsEventLocation }) => {
      if (!currentConfirmation) {
        return;
      }

      if (isUpgrade) {
        setUpgradeCancelModalOpen(true);
        return;
      }

      rejectApproval({ location });
      dispatch(updateCustomNonce(''));
      dispatch(setNextNonce(''));
    },
    [currentConfirmation, isUpgrade],
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
    dispatch(updateCustomNonce(''));
    dispatch(setNextNonce(''));
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
      {isUpgrade && (
        <Checkbox
          label={t('confirmUpgradeAcknowledge')}
          isChecked={isUpgradeAcknowledged}
          onChange={() => setIsUpgradeAcknowledged(!isUpgradeAcknowledged)}
          alignItems={AlignItems.flexStart}
        />
      )}
      <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
        <Button
          block
          data-testid="confirm-footer-cancel-button"
          onClick={handleFooterCancel}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Secondary}
          endIconName={isUpgrade ? IconName.ArrowDown : undefined}
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
