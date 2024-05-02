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
import { MultipleAlertModal } from '../../../../../components/app/confirmations/alerts/multiple-alert-modal';
import {
  BackgroundColor,
  Severity,
} from '../../../../../helpers/constants/design-system';
import { getSeverityBackground } from '../../../../../components/app/confirmations/alerts/utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';

function getSeverityStyle(alerts: Alert[]): BackgroundColor {
  let severity = Severity.Info;
  alerts.forEach((alert) => {
    if (alert.severity === Severity.Danger) {
      severity = Severity.Danger;
    } else if (
      alert.severity === Severity.Warning &&
      severity !== Severity.Danger
    ) {
      severity = Severity.Warning;
    }
  });
  return getSeverityBackground(severity);
}

function ConfirmButton({
  alertOwnerId = '',
  disabled,
  onSubmit,
}: {
  alertOwnerId?: string;
  disabled: boolean;
  onSubmit: () => void;
}) {
  const t = useI18nContext();
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const { alerts, isAlertConfirmed } = useAlerts(alertOwnerId);
  const unconfirmedAlerts = alerts.filter(
    (alert) => alert.field && !isAlertConfirmed(alert.key),
  );
  const hasAlerts = alerts.length > 0;
  const hasUnconfirmedAlerts = unconfirmedAlerts.length > 0;

  const handleCloseModal = () => {
    setAlertModalVisible(false);
  };

  const handleOpenModal = () => {
    setAlertModalVisible(true);
  };

  return (
    <>
      {alertModalVisible ? (
        <MultipleAlertModal
          alertKey={alerts[0]?.key}
          ownerId={alertOwnerId}
          onFinalAcknowledgeClick={handleCloseModal}
          onClose={handleCloseModal}
        />
      ) : null}
      <Button
        block
        data-testid="confirm-footer-confirm-button"
        startIconName={
          hasUnconfirmedAlerts ? IconName.SecuritySearch : undefined
        }
        onClick={hasUnconfirmedAlerts ? handleOpenModal : onSubmit}
        backgroundColor={
          hasAlerts ? getSeverityStyle(alerts) : BackgroundColor.primaryDefault
        }
        size={ButtonSize.Lg}
        disabled={hasUnconfirmedAlerts ? false : disabled}
      >
        {hasUnconfirmedAlerts ? t('reviewAlerts') : t('confirm')}
      </Button>
    </>
  );
}

const Footer = () => {
  const t = useI18nContext();
  const confirm = useSelector(confirmSelector);
  const { currentConfirmation, isScrollToBottomNeeded } = confirm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { mmiOnSignCallback, mmiSubmitDisabled } = useMMIConfirmations();
  ///: END:ONLY_INCLUDE_IF

  const { from } = getConfirmationSender(currentConfirmation);

  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const dispatch = useDispatch();

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
      />
    </PageFooter>
  );
};

export default Footer;
