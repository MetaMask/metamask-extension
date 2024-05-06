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
import { AlertModal } from '../../../../../components/app/confirmations/alerts/alert-modal';

function ConfirmAlertModal({
  alertKey,
  ownerId,
  handleCloseModal,
  hasUnconfirmedAlerts,
  alertModalVisible,
  frictionModalVisible,
  handleOpenModal,
  onCancel,
  onSubmit,
}: {
  alertKey: string;
  ownerId: string;
  handleCloseModal: () => void;
  hasUnconfirmedAlerts: boolean;
  alertModalVisible: boolean;
  frictionModalVisible: boolean;
  handleOpenModal: () => void;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  if (alertModalVisible) {
    return (
      <MultipleAlertModal
        alertKey={alertKey}
        ownerId={ownerId}
        onFinalAcknowledgeClick={handleCloseModal}
        onClose={handleCloseModal}
      />
    );
  }

  if (!hasUnconfirmedAlerts && frictionModalVisible) {
    return (
      <AlertModal
        alertKey={alertKey}
        ownerId={ownerId}
        onAcknowledgeClick={handleCloseModal}
        onClose={handleCloseModal}
        frictionModalConfig={{
          onAlertLinkClick: handleOpenModal,
          onCancel,
          onSubmit,
        }}
      />
    );
  }

  return null;
}

function ConfirmButton({
  alertOwnerId = '',
  disabled,
  onSubmit,
  onCancel,
}: {
  alertOwnerId?: string;
  disabled: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}) {
  const t = useI18nContext();
  const [alertModalVisible, setAlertModalVisible] = useState<boolean>(false);
  const [frictionModalVisible, setFrictionModalVisible] =
    useState<boolean>(false);
  const { alerts, isAlertConfirmed } = useAlerts(alertOwnerId);
  const unconfirmedAlerts = alerts.filter(
    (alert) => alert.field && !isAlertConfirmed(alert.key),
  );
  const hasAlerts = alerts.length > 0;
  const hasUnconfirmedAlerts = unconfirmedAlerts.length > 0;

  const handleCloseModal = () => {
    setAlertModalVisible(false);
  };

  const handleOpenModal = useCallback(() => {
    if (hasUnconfirmedAlerts) {
      setAlertModalVisible(true);
      return;
    }
    setFrictionModalVisible(true);
  }, [hasUnconfirmedAlerts]);

  function getIconName(): IconName {
    if (hasUnconfirmedAlerts) {
      return IconName.SecuritySearch;
    }
    return IconName.Danger;
  }

  return (
    <>
      <ConfirmAlertModal
        alertKey={alerts[0]?.key}
        ownerId={alertOwnerId}
        handleCloseModal={handleCloseModal}
        hasUnconfirmedAlerts={hasUnconfirmedAlerts}
        alertModalVisible={alertModalVisible}
        frictionModalVisible={frictionModalVisible}
        handleOpenModal={() => setAlertModalVisible(true)}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
      <Button
        block
        data-testid="confirm-footer-confirm-button"
        startIconName={hasAlerts ? getIconName() : undefined}
        onClick={hasAlerts ? handleOpenModal : onSubmit}
        danger={hasAlerts}
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
