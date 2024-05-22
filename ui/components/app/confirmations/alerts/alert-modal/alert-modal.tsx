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
  FlexDirection,
  IconColor,
  Severity,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAlerts from '../../../../../hooks/useAlerts';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useAlertActionHandler } from '../../../../../hooks/useAlertActionHandler';

export type AlertModalProps = {
  /**
   * The unique key representing the specific alert field.
   */
  alertKey: string;
  /**
   * The custom button component for acknowledging the alert.
   */
  customAcknowledgeButton?: React.ReactNode;
  /**
   * The custom checkbox component for acknowledging the alert.
   */
  customAcknowledgeCheckbox?: React.ReactNode;
  /**
   * The custom details component for the alert.
   */
  customAlertDetails?: React.ReactNode;
  /**
   * The custom title for the alert.
   */
  customAlertTitle?: string;
  /**
   * The start (left) content area of ModalHeader.
   * It overrides `startAccessory` of ModalHeaderDefault and by default no content is present.
   */
  headerStartAccessory?: React.ReactNode;
  /**
   * The function invoked when the user acknowledges the alert.
   */
  onAcknowledgeClick: () => void;
  /**
   * The function to be executed when the modal needs to be closed.
   */
  onClose: () => void;
  /**
   * The owner ID of the relevant alert from the `confirmAlerts` reducer.
   */
  ownerId: string;
};

export function getSeverityStyle(severity?: Severity) {
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

function AlertHeader({
  selectedAlert,
  customAlertTitle,
}: {
  selectedAlert: Alert;
  customAlertTitle?: string;
}) {
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
          {customAlertTitle ?? selectedAlert.reason ?? t('alert')}
        </Text>
      </Box>
    </>
  );
}

function AlertDetails({
  selectedAlert,
  customAlertDetails,
}: {
  selectedAlert: Alert;
  customAlertDetails?: React.ReactNode;
}) {
  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);
  return (
    <>
      <Box
        key={selectedAlert.key}
        display={Display.InlineBlock}
        padding={2}
        width={BlockSize.Full}
        backgroundColor={
          customAlertDetails ? undefined : severityStyle.background
        }
        gap={2}
        borderRadius={BorderRadius.SM}
      >
        {customAlertDetails ?? (
          <Box>
            <Text variant={TextVariant.bodySm}>{selectedAlert.message}</Text>
            {selectedAlert.alertDetails?.length ? (
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
        )}
      </Box>
    </>
  );
}

export function AcknowledgeCheckboxBase({
  selectedAlert,
  onCheckboxClick,
  isConfirmed,
  label,
}: {
  selectedAlert: Alert;
  onCheckboxClick: () => void;
  isConfirmed: boolean;
  label?: string;
}) {
  if (selectedAlert.isBlocking) {
    return null;
  }

  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);
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
        label={label ?? t('alertModalAcknowledge')}
        data-testid={'alert-modal-acknowledge-checkbox'}
        isChecked={isConfirmed}
        onChange={onCheckboxClick}
        alignItems={AlignItems.flexStart}
        className={'alert-modal__acknowledge-checkbox'}
      />
    </Box>
  );
}

function AcknowledgeButton({
  onAcknowledgeClick,
  isConfirmed,
  hasActions,
  isBlocking,
}: {
  onAcknowledgeClick: () => void;
  isConfirmed: boolean;
  hasActions?: boolean;
  isBlocking?: boolean;
}) {
  const t = useI18nContext();

  if (isBlocking) {
    return null;
  }

  return (
    <Button
      variant={hasActions ? ButtonVariant.Secondary : ButtonVariant.Primary}
      width={BlockSize.Full}
      onClick={onAcknowledgeClick}
      size={ButtonSize.Lg}
      data-testid="alert-modal-button"
      disabled={!isConfirmed}
    >
      {t('gotIt')}
    </Button>
  );
}

function ActionButton({ action }: { action?: { key: string; label: string } }) {
  const { processAction } = useAlertActionHandler();

  if (!action) {
    return null;
  }

  const { key, label } = action;

  return (
    <Button
      key={key}
      variant={ButtonVariant.Primary}
      width={BlockSize.Full}
      size={ButtonSize.Lg}
      onClick={() => processAction(key)}
    >
      {label}
    </Button>
  );
}

export function AlertModal({
  ownerId,
  onAcknowledgeClick,
  alertKey,
  onClose,
  headerStartAccessory,
  customAlertTitle,
  customAlertDetails,
  customAcknowledgeCheckbox,
  customAcknowledgeButton,
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

  const handleCheckboxClick = useCallback(() => {
    return setAlertConfirmed(selectedAlert.key, !isConfirmed);
  }, [isConfirmed, selectedAlert.key]);

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
        <AlertHeader
          selectedAlert={selectedAlert}
          customAlertTitle={customAlertTitle}
        />
        <ModalBody>
          <AlertDetails
            selectedAlert={selectedAlert}
            customAlertDetails={customAlertDetails}
          />
          {customAcknowledgeCheckbox ?? (
            <AcknowledgeCheckboxBase
              selectedAlert={selectedAlert}
              isConfirmed={isConfirmed}
              onCheckboxClick={handleCheckboxClick}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
            width={BlockSize.Full}
          >
            {customAcknowledgeButton ?? (
              <>
                <AcknowledgeButton
                  onAcknowledgeClick={onAcknowledgeClick}
                  isConfirmed={isConfirmed}
                  hasActions={Boolean(selectedAlert.actions)}
                  isBlocking={selectedAlert.isBlocking}
                />
                {(selectedAlert.actions ?? []).map((action) => (
                  <ActionButton key={action.key} action={action} />
                ))}
              </>
            )}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
