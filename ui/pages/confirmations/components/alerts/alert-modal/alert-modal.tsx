import React, { useCallback, useState } from 'react';
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
} from '../../../../../components/component-library';
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
import useAlerts from '../../../hooks/useAlerts';

export type AlertModalProps = {
  /** The unique identifier of the entity that owns the alert. */
  ownerId: string;
  /** The function to be executed when the button in the alert modal is clicked. */
  onButtonClick: () => void;
  /** The unique key representing the specific alert field. */
  alertKey: string;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
  /** Customizable button  */
  customButton?: {
    /** The label for the custom button. */
    label: string;
    /** The function to be executed when the custom button is clicked. */
    onClick: () => void;
    /** The variant of the custom button. */
    variant?: string;
  };
  /**
   * The navigation component passed when more exists more than one alert.
   * It override `startAccessory` of ModalHeaderDefault and by default no navigation button is present.
   */
  multipleAlerts?: React.ReactNode;
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

export function AlertModal({
  ownerId,
  onButtonClick,
  alertKey,
  onClose,
  customButton,
  multipleAlerts,
}: AlertModalProps) {
  const t = useI18nContext();
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  const { alerts, isAlertConfirmed, setAlertConfirmed } = useAlerts(ownerId);

  const selectedAlert = alerts.find((alert) => alert.key === alertKey);

  if (!selectedAlert) {
    return null;
  }
  const isConfirmed = isAlertConfirmed(selectedAlert.key);
  const [isAlertAcknowledged, setIsAlertAcknowledged] = useState({
    [selectedAlert.key]: isConfirmed,
  });
  const severityStyle = getSeverityStyle(selectedAlert.severity);

  return (
    <Modal isOpen onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={handleClose}
          startAccessory={multipleAlerts}
          className={'alert-modal__header'}
          borderWidth={1}
          display={multipleAlerts ? Display.InlineFlex : Display.Block}
        />
        <ModalBody>
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
              {selectedAlert.reason || t('alerts')}
            </Text>
          </Box>
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
            {selectedAlert.alertDetails &&
            selectedAlert.alertDetails?.length > 0 ? (
              <Text variant={TextVariant.bodySmBold} marginTop={1}>
                {t('alertModalDetails')}
              </Text>
            ) : null}

            <Box
              as="ul"
              className={'alert-modal__alert-details'}
              paddingLeft={6}
            >
              {selectedAlert.alertDetails?.map((detail, index) => (
                <Box as="li" key={`${selectedAlert.key}-detail-${index}`}>
                  <Text variant={TextVariant.bodySm}>{detail}</Text>
                </Box>
              ))}
            </Box>
          </Box>
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
              isChecked={isAlertAcknowledged[selectedAlert.key]}
              onChange={() =>
                setIsAlertAcknowledged((prevState) => ({
                  ...prevState,
                  [selectedAlert.key]: !prevState[selectedAlert.key],
                }))
              }
              alignItems={AlignItems.flexStart}
              className={'alert-modal__acknowledge-checkbox'}
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.Primary}
            width={BlockSize.Full}
            onClick={() => {
              setAlertConfirmed(selectedAlert.key, !isConfirmed);
              onButtonClick();
            }}
            size={ButtonSize.Lg}
            data-testid="alert-modal-button"
            disabled={!isAlertAcknowledged[selectedAlert.key]}
          >
            {t('gotIt')}
          </Button>
          {customButton && (
            <Button
              variant={ButtonVariant.Secondary}
              className={customButton.variant}
              width={BlockSize.Full}
              onClick={customButton.onClick}
              size={ButtonSize.Lg}
            >
              {customButton.label}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
