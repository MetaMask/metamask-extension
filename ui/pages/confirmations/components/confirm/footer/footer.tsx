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
import { ConfirmAlertModal } from '../../../../../components/app/confirmations/alerts/confirm-alert-modal';
import useIsDangerButton from './useIsDangerButton';

function getIconName(hasUnconfirmedAlerts: boolean): IconName {
  if (hasUnconfirmedAlerts) {
    return IconName.SecuritySearch;
  }
  return IconName.Danger;
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
  const { alerts, isAlertConfirmed } = useAlerts(alertOwnerId);
  const unconfirmedAlerts = alerts.filter(
    (alert) => alert.field && !isAlertConfirmed(alert.key),
  );
  const hasAlerts = alerts.length > 0;
  const hasUnconfirmedAlerts = unconfirmedAlerts.length > 0;

  const handleCloseConfirmModal = useCallback(() => {
    setConfirmModalVisible(false);
  }, []);

  const handleOpenConfirmModal = useCallback(() => {
    setConfirmModalVisible(true);
  }, [hasUnconfirmedAlerts]);

  return (
    <>
      {confirmModalVisible && (
        <ConfirmAlertModal
          alertKey={alerts[0]?.key}
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
          hasAlerts ? getIconName(hasUnconfirmedAlerts) : undefined
        }
        onClick={hasAlerts ? handleOpenConfirmModal : onSubmit}
        danger={hasAlerts ? true : isDangerButton}
        size={ButtonSize.Lg}
        disabled={hasUnconfirmedAlerts ? false : disabled}
      >
        {hasUnconfirmedAlerts ? t('reviewAlerts') : t('confirm')}
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
