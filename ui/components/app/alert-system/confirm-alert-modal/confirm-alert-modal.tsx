import React, { useCallback, useState } from 'react';

import {
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  Severity,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import useAlerts from '../../../../hooks/useAlerts';
import { AlertModal } from '../alert-modal';
import { AcknowledgeCheckboxBase } from '../alert-modal/alert-modal';
import { MultipleAlertModal } from '../multiple-alert-modal';
import { MetaMetricsEventLocation } from '../../../../../shared/constants/metametrics';
import { OnCancelHandler } from '../../../../pages/confirmations/components/confirm/footer/footer';

export type ConfirmAlertModalProps = {
  /** Callback function that is called when the cancel button is clicked. */
  onCancel: OnCancelHandler;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
  /** Callback function that is called when the submit button is clicked. */
  onSubmit: () => void;
  /** The owner ID of the relevant alert from the `confirmAlerts` reducer. */
  ownerId: string;
};

function ConfirmButtons({
  onCancel,
  onSubmit,
  isConfirmed,
}: {
  onCancel: OnCancelHandler;
  onSubmit: () => void;
  isConfirmed: boolean;
}) {
  const t = useI18nContext();
  const onAlertCancel = useCallback(() => {
    onCancel({ location: MetaMetricsEventLocation.AlertFrictionModal });
  }, [onCancel]);

  return (
    <>
      <Button
        block
        onClick={onAlertCancel}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
        data-testid="confirm-alert-modal-cancel-button"
      >
        {t('reject')}
      </Button>
      <Button
        variant={ButtonVariant.Primary}
        onClick={onSubmit}
        size={ButtonSize.Lg}
        data-testid="confirm-alert-modal-submit-button"
        disabled={!isConfirmed}
        danger
        startIconName={IconName.Danger}
      >
        {t('confirm')}
      </Button>
    </>
  );
}

function ConfirmDetails({
  onAlertLinkClick,
}: {
  onAlertLinkClick?: () => void;
}) {
  const t = useI18nContext();
  return (
    <>
      <Box alignItems={AlignItems.center} textAlign={TextAlign.Center}>
        <Text variant={TextVariant.bodyMd}>
          {t('confirmationAlertModalDetails')}
        </Text>
        <ButtonLink
          marginTop={4}
          size={ButtonLinkSize.Inherit}
          textProps={{
            variant: TextVariant.bodyMd,
            alignItems: AlignItems.flexStart,
          }}
          as="a"
          onClick={onAlertLinkClick}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="confirm-alert-modal-review-all-alerts"
        >
          <Icon name={IconName.SecuritySearch} size={IconSize.Inherit} />
          {t('alertModalReviewAllAlerts')}
        </ButtonLink>
      </Box>
    </>
  );
}

export function ConfirmAlertModal({
  onCancel,
  onClose,
  onSubmit,
  ownerId,
}: ConfirmAlertModalProps) {
  const t = useI18nContext();
  const { fieldAlerts, alerts, hasUnconfirmedFieldDangerAlerts } =
    useAlerts(ownerId);

  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);

  const hasDangerBlockingAlerts = fieldAlerts.some(
    (alert) => alert.severity === Severity.Danger && alert.isBlocking,
  );

  // if there are unconfirmed danger alerts, show the multiple alert modal
  const [multipleAlertModalVisible, setMultipleAlertModalVisible] =
    useState<boolean>(hasUnconfirmedFieldDangerAlerts);

  const handleCloseMultipleAlertModal = useCallback(
    (request?: { recursive?: boolean }) => {
      setMultipleAlertModalVisible(false);

      if (
        request?.recursive ||
        hasUnconfirmedFieldDangerAlerts ||
        hasDangerBlockingAlerts
      ) {
        onClose();
      }
    },
    [onClose, hasUnconfirmedFieldDangerAlerts, hasDangerBlockingAlerts],
  );

  const handleOpenMultipleAlertModal = useCallback(() => {
    setMultipleAlertModalVisible(true);
  }, []);

  const handleConfirmCheckbox = useCallback(() => {
    setConfirmCheckbox(!confirmCheckbox);
  }, [confirmCheckbox]);

  if (multipleAlertModalVisible) {
    return (
      <MultipleAlertModal
        ownerId={ownerId}
        onFinalAcknowledgeClick={handleCloseMultipleAlertModal}
        onClose={handleCloseMultipleAlertModal}
        showCloseIcon={false}
      />
    );
  }

  const selectedAlert = alerts[0];

  if (!selectedAlert) {
    return null;
  }

  return (
    <AlertModal
      ownerId={ownerId}
      onAcknowledgeClick={onClose}
      alertKey={selectedAlert.key}
      onClose={onClose}
      customTitle={t('confirmationAlertModalTitle')}
      customDetails={
        <ConfirmDetails onAlertLinkClick={handleOpenMultipleAlertModal} />
      }
      customAcknowledgeCheckbox={
        <AcknowledgeCheckboxBase
          selectedAlert={selectedAlert}
          isConfirmed={confirmCheckbox}
          onCheckboxClick={handleConfirmCheckbox}
          label={
            alerts.length === 1
              ? t('confirmAlertModalAcknowledgeSingle')
              : t('confirmAlertModalAcknowledgeMultiple')
          }
        />
      }
      customAcknowledgeButton={
        <ConfirmButtons
          onCancel={onCancel}
          onSubmit={onSubmit}
          isConfirmed={confirmCheckbox}
        />
      }
    />
  );
}
