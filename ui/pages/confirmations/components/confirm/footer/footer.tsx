import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ethErrors, serializeError } from 'eth-rpc-errors';

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
import useAlerts from '../../../../../hooks/useAlerts';
import { MultipleAlertModal } from '../../../../../components/app/confirmations/alerts/multiple-alert-modal';
import {
  BackgroundColor,
  Severity,
} from '../../../../../helpers/constants/design-system';
import { getSeverityBackground } from '../../../../../components/app/confirmations/alerts/alert-utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';

function ReviewAlertButton({
  backgroundColor,
  setAlertModalVisible,
}: {
  backgroundColor: BackgroundColor;
  setAlertModalVisible: (visible: boolean) => void;
}) {
  const t = useI18nContext();
  return (
    <Button
      block
      backgroundColor={backgroundColor}
      onClick={() => setAlertModalVisible(true)}
      startIconName={IconName.SecuritySearch}
      size={ButtonSize.Lg}
      data-testid="review-alert-button"
    >
      {t('reviewAlerts')}
    </Button>
  );
}

function ConfirmFooterButton({
  hasUnconfirmedAlerts,
  unconfirmedAlerts,
  setAlertModalVisible,
  onSubmit,
  disabled,
}: {
  hasUnconfirmedAlerts: boolean;
  unconfirmedAlerts: Alert[];
  setAlertModalVisible: (visible: boolean) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const t = useI18nContext();

  function severityStyle() {
    let severity = Severity.Info;
    unconfirmedAlerts.forEach((alert) => {
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

  return hasUnconfirmedAlerts ? (
    <ReviewAlertButton
      backgroundColor={severityStyle()}
      setAlertModalVisible={setAlertModalVisible}
    />
  ) : (
    <Button
      block
      data-testid="confirm-footer-confirm-button"
      onClick={onSubmit}
      backgroundColor={
        hasUnconfirmedAlerts ? severityStyle() : BackgroundColor.primaryDefault
      }
      size={ButtonSize.Lg}
      disabled={disabled}
    >
      {t('confirm')}
    </Button>
  );
}

const Footer = () => {
  const t = useI18nContext();
  const confirm = useSelector(confirmSelector);
  const { currentConfirmation, isScrollToBottomNeeded } = confirm;
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const { mmiOnSignCallback, mmiSubmitDisabled } = useMMIConfirmations();
  ///: END:ONLY_INCLUDE_IF

  let from: string | undefined;
  // todo: extend to other confirmation types
  if (currentConfirmation?.msgParams) {
    from = currentConfirmation.msgParams.from;
  }
  const hardwareWalletRequiresConnection = useSelector((state) => {
    if (from) {
      return doesAddressRequireLedgerHidConnection(state, from);
    }
    return false;
  });

  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const alertOwnerId = currentConfirmation?.id as string;
  const { alerts, isAlertConfirmed } = useAlerts(alertOwnerId);
  const unconfirmedAlerts = alerts.filter(
    (alert) => alert.field && !isAlertConfirmed(alert.key),
  );
  const hasUnconfirmedAlerts = unconfirmedAlerts.length > 0;

  const handleCloseModal = useCallback(() => {
    setAlertModalVisible(false);
  }, []);

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
      {alertModalVisible ? (
        <MultipleAlertModal
          alertKey={unconfirmedAlerts[0]?.key}
          ownerId={alertOwnerId}
          onFinalAcknowledgeClick={handleCloseModal}
          onClose={handleCloseModal}
        />
      ) : null}
      <ConfirmFooterButton
        hasUnconfirmedAlerts={hasUnconfirmedAlerts}
        unconfirmedAlerts={unconfirmedAlerts}
        setAlertModalVisible={setAlertModalVisible}
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
