import { ethErrors, serializeError } from 'eth-rpc-errors';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useMMIConfirmations } from '../../../../../hooks/useMMIConfirmations';
///: END:ONLY_INCLUDE_IF

import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import { confirmSelector } from '../../../selectors';
import { getConfirmationSender } from '../utils';
import useAlerts from '../../../../../hooks/useAlerts';
import { ConfirmAlertModal } from '../../../../../components/app/alert-system/confirm-alert-modal';
import { Severity } from '../../../../../helpers/constants/design-system';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import useIsDangerButton from './useIsDangerButton';

function getIconName(hasUnconfirmedAlerts: boolean): IconName {
  return hasUnconfirmedAlerts ? IconName.SecuritySearch : IconName.Danger;
}

function ConfirmButton({
  alertOwnerId = '',
  disabled,
  onSubmit,
  onCancel,
}: {
  alertOwnerId?: string;
  disabled: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const isDangerButton = useIsDangerButton();
  const t = useI18nContext();

  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);
  const { alerts, isAlertConfirmed, fieldAlerts } = useAlerts(alertOwnerId);
  const unconfirmedDangerAlerts = fieldAlerts.filter(
    (alert: Alert) =>
      !isAlertConfirmed(alert.key) && alert.severity === Severity.Danger,
  );

  const hasDangerAlerts = alerts.some(
    (alert: Alert) => alert.severity === Severity.Danger,
  );
  const hasDangerFieldAlerts = fieldAlerts.some(
    (alert: Alert) => alert.severity === Severity.Danger,
  );
  const hasUnconfirmedDangerAlerts = unconfirmedDangerAlerts.length > 0;

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
          alertKey={fieldAlerts[0]?.key}
          ownerId={alertOwnerId}
          onClose={handleCloseConfirmModal}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
      <Button
        block
        data-testid="confirm-footer-confirm-button"
        startIconName={
          hasDangerAlerts ? getIconName(hasUnconfirmedDangerAlerts) : undefined
        }
        onClick={hasDangerFieldAlerts ? handleOpenConfirmModal : onSubmit}
        danger={hasDangerAlerts ? true : isDangerButton}
        size={ButtonSize.Lg}
        disabled={hasUnconfirmedDangerAlerts ? false : disabled}
      >
        {hasUnconfirmedDangerAlerts ? t('reviewAlerts') : t('confirm')}
      </Button>
    </>
  );
}

const Footer = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const confirm = useSelector(confirmSelector);

  const { currentConfirmation, isScrollToBottomNeeded } = confirm;
  const { from } = getConfirmationSender(currentConfirmation);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { mmiOnSignCallback, mmiSubmitDisabled } = useMMIConfirmations();
  ///: END:ONLY_INCLUDE_IF

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const onCancel = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }

    dispatch(
      rejectPendingApproval(
        currentConfirmation.id,
        serializeError(ethErrors.provider.userRejectedRequest()),
      ),
    );
  }, [currentConfirmation]);

  const onSubmit = useCallback(() => {
    if (!currentConfirmation) {
      return;
    }

    dispatch(resolvePendingApproval(currentConfirmation.id, undefined));

    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiOnSignCallback();
    ///: END:ONLY_INCLUDE_IF
  }, [currentConfirmation]);

  return (
    <PageFooter className="confirm-footer_page-footer">
      <Button
        block
        onClick={onCancel}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
      >
        {t('cancel')}
      </Button>
      <ConfirmButton
        alertOwnerId={currentConfirmation?.id}
        onSubmit={onSubmit}
        disabled={
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          mmiSubmitDisabled ||
          ///: END:ONLY_INCLUDE_IF
          isScrollToBottomNeeded ||
          hardwareWalletRequiresConnection
        }
        onCancel={onCancel}
      />
    </PageFooter>
  );
};

export default Footer;
