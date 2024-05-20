import React, { useCallback } from 'react';
import { ButtonVariant } from '@metamask/snaps-sdk';
import {
  Box,
  Button,
  ButtonSize,
  Checkbox,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  IconColor,
  Severity,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAlerts from '../../../../../hooks/useAlerts';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';

export type AlertModalProps = {
  /** The unique key representing the specific alert field. */
  alertKey: string;
  /**
   * The start (left) content area of ModalHeader.
   * It override `startAccessory` of ModalHeaderDefault and by default no content is present.
   */
  headerStartAccessory?: React.ReactNode;
  /** The owner ID of the relevant alert from the `confirmAlerts` reducer. */
  ownerId: string;
  /** The function invoked when the user acknowledges the alert. */
  onAcknowledgeClick: () => void;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
};

function getSeverityStyle(severity: Severity) {
  switch (severity) {
    case Severity.Warning:
      return {
        background: BackgroundColor.warningMuted,
        icon: IconColor.warningDefault,
      };
    case Severity.Danger:
      return {
        background: BackgroundColor.errorMuted,
        icon: IconColor.errorDefault,
      };
    default:
      return {
        background: BackgroundColor.infoMuted,
        icon: IconColor.infoDefault,
      };
  }
}

function AlertHeader({ selectedAlert }: { selectedAlert: Alert }) {
  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);
  return (
    <>
      <Box
        gap={3}
        display={Display.Block}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        marginTop={3}
      >
        <Icon
          name={
            selectedAlert.severity === Severity.Info
              ? IconName.Info
              : IconName.Danger
          }
          size={IconSize.Xl}
          color={severityStyle.icon}
        />
        <Text
          variant={TextVariant.headingSm}
          color={TextColor.inherit}
          marginTop={3}
          marginBottom={4}
        >
          {selectedAlert.reason ?? t('alert')}
        </Text>
      </Box>
    </>
  );
}

function AlertDetails({ selectedAlert }: { selectedAlert: Alert }) {
  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);
  return (
    <Box
      key={selectedAlert.key}
      display={Display.InlineBlock}
      padding={2}
      width={BlockSize.Full}
      backgroundColor={severityStyle.background}
      gap={2}
      borderRadius={BorderRadius.SM}
    >
      <Text variant={TextVariant.bodySm}>{selectedAlert.message}</Text>
      {selectedAlert.alertDetails?.length ? (
        <Text variant={TextVariant.bodySmBold} marginTop={1}>
          {t('alertModalDetails')}
        </Text>
      ) : null}

      <Box as="ul" className={'alert-modal__alert-details'} paddingLeft={6}>
        {selectedAlert.alertDetails?.map((detail, index) => (
          <Box as="li" key={`${selectedAlert.key}-detail-${index}`}>
            <Text variant={TextVariant.bodySm}>{detail}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function AcknowledgeCheckbox({
  selectedAlert,
  setAlertConfirmed,
  isConfirmed,
}: {
  selectedAlert: Alert;
  setAlertConfirmed: (alertKey: string, isConfirmed: boolean) => void;
  isConfirmed: boolean;
}) {
  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);
  const handleCheckboxClick = () => {
    return setAlertConfirmed(selectedAlert.key, !isConfirmed);
  };
  return (
    <Box
      display={Display.Flex}
      padding={3}
      width={BlockSize.Full}
      gap={3}
      backgroundColor={severityStyle.background}
      marginTop={4}
      borderRadius={BorderRadius.LG}
    >
      <Checkbox
        label={t('alertModalAcknowledge')}
        data-testid="alert-modal-acknowledge-checkbox"
        isChecked={isConfirmed}
        onChange={handleCheckboxClick}
        alignItems={AlignItems.flexStart}
        className={'alert-modal__acknowledge-checkbox'}
      />
    </Box>
  );
}

function AcknowledgeButton({
  onAcknowledgeClick,
  isConfirmed,
}: {
  onAcknowledgeClick: () => void;
  isConfirmed: boolean;
}) {
  const t = useI18nContext();

  return (
    <>
      <Button
        variant={ButtonVariant.Primary}
        width={BlockSize.Full}
        onClick={onAcknowledgeClick}
        size={ButtonSize.Lg}
        data-testid="alert-modal-button"
        disabled={!isConfirmed}
      >
        {t('gotIt')}
      </Button>
    </>
  );
}

export function AlertModal({
  ownerId,
  onAcknowledgeClick,
  alertKey,
  onClose,
  headerStartAccessory,
}: AlertModalProps) {
  const { alerts, isAlertConfirmed, setAlertConfirmed } = useAlerts(ownerId);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const selectedAlert = alerts.find((alert) => alert.key === alertKey);

  if (!selectedAlert) {
    return null;
  }
  const isConfirmed = isAlertConfirmed(selectedAlert.key);

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleClose}
          startAccessory={headerStartAccessory}
          className={'alert-modal__header'}
          borderWidth={1}
          display={headerStartAccessory ? Display.InlineFlex : Display.Block}
        />
        <AlertHeader selectedAlert={selectedAlert} />
        <ModalBody>
          <AlertDetails selectedAlert={selectedAlert} />
          <AcknowledgeCheckbox
            selectedAlert={selectedAlert}
            isConfirmed={isConfirmed}
            setAlertConfirmed={setAlertConfirmed}
          />
        </ModalBody>
        <ModalFooter>
          <AcknowledgeButton
            onAcknowledgeClick={onAcknowledgeClick}
            isConfirmed={isConfirmed}
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
