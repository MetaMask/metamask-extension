import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { PRODUCT_TYPES } from '@metamask/subscription-controller';
import React, { useCallback, useState } from 'react';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import { ConfirmAlertModal } from '../../../../../components/app/alert-system/confirm-alert-modal';
import {
  Button,
  ButtonSize,
  IconName,
} from '../../../../../components/component-library';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import useAlerts from '../../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserSubscriptions } from '../../../../../hooks/subscription/useSubscription';
import { useConfirmContext } from '../../../context/confirm';

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

export const ConfirmButton = ({
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
    hasUnconfirmedDangerAlerts,
    hasUnconfirmedFieldDangerAlerts,
    setAlertConfirmed,
    unconfirmedDangerAlerts,
    unconfirmedFieldDangerAlerts,
  } = useAlerts(alertOwnerId);

  const hasDangerBlockingAlerts = alerts.some(
    (alert) => alert.severity === Severity.Danger && alert.isBlocking,
  );
  const shouldShowDangerConfirmButton =
    hasUnconfirmedDangerAlerts || hasDangerBlockingAlerts;

  const handleCloseConfirmModal = useCallback(() => {
    setConfirmModalVisible(false);
  }, []);

  const handleOpenConfirmModal = useCallback(() => {
    setConfirmModalVisible(true);
  }, []);

  const handleSubmitConfirmModal = useCallback(async () => {
    if (currentConfirmation?.id && alertOwnerId === currentConfirmation.id) {
      const [selectedUnconfirmedDangerAlert] = unconfirmedDangerAlerts;

      if (selectedUnconfirmedDangerAlert) {
        setAlertConfirmed(selectedUnconfirmedDangerAlert.key, true);
      }
    }

    setConfirmModalVisible(false);
  }, [
    alertOwnerId,
    currentConfirmation?.id,
    setAlertConfirmed,
    unconfirmedDangerAlerts,
  ]);

  const { trialedProducts } = useUserSubscriptions();
  const isShieldTrialed = trialedProducts?.includes(PRODUCT_TYPES.SHIELD);

  return (
    <>
      {confirmModalVisible && (
        <ConfirmAlertModal
          ownerId={alertOwnerId}
          onClose={handleCloseConfirmModal}
          onCancel={onCancel}
          onSubmit={handleSubmitConfirmModal}
        />
      )}
      {shouldShowDangerConfirmButton ? (
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
