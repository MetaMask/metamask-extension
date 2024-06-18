import { ethErrors, serializeError } from 'eth-rpc-errors';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '../../../../../components/component-library';
import { ConfirmAlertModal } from '../../../../../components/app/alert-system/confirm-alert-modal';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import { doesAddressRequireLedgerHidConnection } from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { useMMIConfirmations } from '../../../../../hooks/useMMIConfirmations';
///: END:ONLY_INCLUDE_IF
import {
  rejectPendingApproval,
  resolvePendingApproval,
} from '../../../../../store/actions';
import useAlerts from '../../../../../hooks/useAlerts';
import { confirmSelector } from '../../../selectors';
import { getConfirmationSender } from '../utils';

function getIconName(hasUnconfirmedAlerts: boolean): IconName {
  return hasUnconfirmedAlerts ? IconName.SecuritySearch : IconName.Danger;
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
  onCancel: () => void;
}) => {
  const t = useI18nContext();

  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);

  const { alerts, dangerAlerts, hasDangerAlerts, hasUnconfirmedDangerAlerts } =
    useAlerts(alertOwnerId);

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
          alertKey={alerts[0]?.key}
          ownerId={alertOwnerId}
          onClose={handleCloseConfirmModal}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
      {hasDangerAlerts ? (
        <Button
          block
          data-testid="confirm-footer-button"
          startIconName={getIconName(hasUnconfirmedDangerAlerts)}
          onClick={handleOpenConfirmModal}
          danger
          size={ButtonSize.Lg}
          disabled={hasUnconfirmedDangerAlerts ? false : disabled}
        >
          {dangerAlerts?.length > 1 ? t('reviewAlerts') : t('confirm')}
        </Button>
      ) : (
        <Button
          block
          data-testid="confirm-footer-button"
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
        data-testid="confirm-footer-cancel-button"
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
