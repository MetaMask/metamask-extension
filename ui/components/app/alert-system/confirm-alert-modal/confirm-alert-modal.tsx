import React, { useCallback, useState } from 'react';

import { SecurityProvider } from '../../../../../shared/constants/security-provider';
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
          {t('confirmAlertModalDetails')}
        </Text>
        <ButtonLink
          paddingTop={5}
          paddingBottom={5}
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
          <Icon
            name={IconName.SecuritySearch}
            size={IconSize.Inherit}
            marginLeft={1}
          />
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
  const { alerts, unconfirmedDangerAlerts } = useAlerts(ownerId);

  const [confirmCheckbox, setConfirmCheckbox] = useState<boolean>(false);

  // if there are multiple alerts, show the multiple alert modal
  const [multipleAlertModalVisible, setMultipleAlertModalVisible] =
    useState<boolean>(unconfirmedDangerAlerts.length > 1);

  const handleCloseMultipleAlertModal = useCallback(
    (request?: { recursive?: boolean }) => {
      setMultipleAlertModalVisible(false);

      if (request?.recursive) {
        onClose();
      }
    },
    [onClose],
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
      customTitle={t('confirmAlertModalTitle')}
      customDetails={
        selectedAlert.provider === SecurityProvider.Blockaid ? (
          SecurityProvider.Blockaid
        ) : (
          <ConfirmDetails onAlertLinkClick={handleOpenMultipleAlertModal} />
        )
      }
      customAcknowledgeCheckbox={
        <AcknowledgeCheckboxBase
          selectedAlert={selectedAlert}
          isConfirmed={confirmCheckbox}
          onCheckboxClick={handleConfirmCheckbox}
          label={
            selectedAlert?.provider === SecurityProvider.Blockaid
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
      enableProvider={false}
    />
  );
}
