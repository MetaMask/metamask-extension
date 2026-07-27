import { ButtonVariant } from '@metamask/snaps-sdk';
import React, { useCallback, useEffect } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import {
  BlockaidReason,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import {
  AlignItems,
  BlockSize,
  Display,
  IconColor,
  Severity,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import useAlerts from '../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
import {
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
} from '../../../component-library';
import { useAlertActionHandler } from '../contexts/alertActionHandler';
import { useAlertMetrics } from '../contexts/alertMetricsContext';

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
  customDetails?: React.ReactNode;
  /**
   * The custom title for the alert.
   */
  customTitle?: string;
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
  onClose: (request?: { recursive?: boolean }) => void;
  /**
   * The owner ID of the relevant alert from the `confirmAlerts` reducer.
   */
  ownerId: string;
  /**
   * Whether to show the close icon in the modal header.
   */
  showCloseIcon?: boolean;
};

function getSeverityStyle(severity?: Severity) {
  switch (severity) {
    case Severity.Warning:
      return {
        background: BoxBackgroundColor.WarningMuted,
        icon: IconColor.warningDefault,
      };
    case Severity.Danger:
      return {
        background: BoxBackgroundColor.ErrorMuted,
        icon: IconColor.errorDefault,
      };
    default:
      return {
        background: BoxBackgroundColor.BackgroundDefault,
        icon: IconColor.infoDefault,
      };
  }
}

function requiresAcknowledgement(alert: Alert) {
  return (
    alert.severity === Severity.Danger &&
    !alert.isBlocking &&
    !alert.acknowledgeBypass
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function AlertHeader({
  selectedAlert,
  customTitle,
}: {
  selectedAlert: Alert;
  customTitle?: string;
}) {
  const t = useI18nContext();
  const { severity, reason, iconName, iconColor } = selectedAlert;
  const severityStyle = getSeverityStyle(severity);
  return (
    <Box
      gap={3}
      className="block text-center"
      alignItems={BoxAlignItems.Center}
    >
      <Icon
        name={
          iconName ??
          (severity === Severity.Info || severity === Severity.Success
            ? IconName.Info
            : IconName.Danger)
        }
        size={IconSize.Xl}
        color={iconColor ?? severityStyle.icon}
      />
      <Text
        variant={TextVariant.headingSm}
        color={TextColor.inherit}
        marginTop={3}
        marginBottom={4}
      >
        {customTitle ?? reason ?? t('alert')}
      </Text>
    </Box>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function BlockaidAlertDetails() {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const { securityAlertResponse } = currentConfirmation;
  let copy;
  switch (securityAlertResponse?.reason) {
    case BlockaidReason.approvalFarming:
    case BlockaidReason.setApprovalForAll:
    case BlockaidReason.permitFarming:
      copy = t('blockaidAlertDescriptionWithdraw');
      break;
    case BlockaidReason.transferFarming:
    case BlockaidReason.transferFromFarming:
    case BlockaidReason.rawNativeTokenTransfer:
      copy = t('blockaidAlertDescriptionTokenTransfer');
      break;
    case BlockaidReason.seaportFarming:
      copy = t('blockaidAlertDescriptionOpenSea');
      break;
    case BlockaidReason.blurFarming:
      copy = t('blockaidAlertDescriptionBlur');
      break;
    case BlockaidReason.maliciousDomain:
      copy = t('blockaidAlertDescriptionMalicious');
      break;
    case BlockaidReason.rawSignatureFarming:
    case BlockaidReason.tradeOrderFarming:
    case BlockaidReason.other:
    default:
      copy = t('blockaidAlertDescriptionOthers');
  }

  return (
    <Text textAlign={TextAlign.Center} variant={TextVariant.bodyMd}>
      {copy}
    </Text>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function AlertDetails({
  selectedAlert,
  customDetails,
}: {
  selectedAlert: Alert;
  customDetails?: React.ReactNode;
}) {
  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);
  const customAlertBg = selectedAlert.alertDetailsBackgroundColor;

  return (
    <Box
      key={selectedAlert.key}
      className="inline-block w-full rounded-sm"
      padding={customDetails ? 0 : 2}
      backgroundColor={
        customDetails || customAlertBg ? undefined : severityStyle.background
      }
      style={
        !customDetails && customAlertBg
          ? { backgroundColor: `var(--color-${customAlertBg})` }
          : undefined
      }
    >
      {customDetails ?? (
        <Box>
          {Boolean(selectedAlert.content) && selectedAlert.content}
          {Boolean(selectedAlert.message) && (
            <Text
              variant={TextVariant.bodyMd}
              data-testid="alert-modal__selected-alert"
            >
              {selectedAlert.message}
            </Text>
          )}
          {selectedAlert.alertDetails?.length ? (
            <Text variant={TextVariant.bodyMdBold} marginTop={1}>
              {t('alertModalDetails')}
            </Text>
          ) : null}
          <Box asChild paddingLeft={6}>
            <ul className="alert-modal__alert-details">
              {selectedAlert.alertDetails?.map((detail, index) => (
                <Box asChild key={`${selectedAlert.key}-detail-${index}`}>
                  <li>
                    <Text variant={TextVariant.bodyMd}>{detail}</Text>
                  </li>
                </Box>
              ))}
            </ul>
          </Box>
        </Box>
      )}
    </Box>
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
  const t = useI18nContext();
  const severityStyle = getSeverityStyle(selectedAlert.severity);

  if (!requiresAcknowledgement(selectedAlert)) {
    return null;
  }

  return (
    <Box
      className="flex w-full rounded-lg"
      padding={4}
      backgroundColor={severityStyle.background}
      marginTop={4}
    >
      <Checkbox
        label={label ?? t('alertModalAcknowledge')}
        data-testid="alert-modal-acknowledge-checkbox"
        isChecked={isConfirmed}
        onChange={onCheckboxClick}
        alignItems={AlignItems.flexStart}
        className="alert-modal__acknowledge-checkbox"
      />
    </Box>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function AcknowledgeButton({
  onAcknowledgeClick,
  isConfirmed,
  hasActions,
  isBlocking,
  label,
}: {
  onAcknowledgeClick: () => void;
  isConfirmed: boolean;
  hasActions?: boolean;
  isBlocking?: boolean;
  label?: string;
}) {
  const t = useI18nContext();

  return (
    <Button
      variant={hasActions ? ButtonVariant.Secondary : ButtonVariant.Primary}
      width={BlockSize.Full}
      onClick={onAcknowledgeClick}
      size={ButtonSize.Lg}
      data-testid="alert-modal-button"
      disabled={!isBlocking && !isConfirmed}
    >
      {label ?? t('gotIt')}
    </Button>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function ActionButton({
  action,
  onClose,
  alertKey,
}: {
  action?: { key: string; label: string };
  onClose: (request: { recursive?: boolean } | void) => void;
  alertKey: string;
}) {
  const { processAction } = useAlertActionHandler();
  const { trackAlertActionClicked } = useAlertMetrics();

  const handleClick = useCallback(() => {
    if (!action) {
      return;
    }
    trackAlertActionClicked(alertKey);

    processAction(action.key);
    onClose({ recursive: true });
  }, [action, onClose, processAction, trackAlertActionClicked, alertKey]);

  if (!action) {
    return null;
  }

  const { key, label } = action;
  const dataTestId = `alert-modal-action-${key}`;

  return (
    <Button
      data-testid={dataTestId}
      key={key}
      variant={ButtonVariant.Primary}
      width={BlockSize.Full}
      size={ButtonSize.Lg}
      onClick={handleClick}
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
  customTitle,
  customDetails,
  customAcknowledgeCheckbox,
  customAcknowledgeButton,
  showCloseIcon = true,
}: AlertModalProps) {
  const { isAlertConfirmed, setAlertConfirmed, alerts } = useAlerts(ownerId);
  const { trackAlertRender } = useAlertMetrics();

  const handleClose = useCallback(
    (request?: { recursive?: boolean } | void) => {
      onClose(request ?? undefined);
    },
    [onClose],
  );

  const selectedAlert = alerts.find((alert: Alert) => alert.key === alertKey);

  useEffect(() => {
    if (selectedAlert) {
      trackAlertRender(selectedAlert.key);
    }
  }, [selectedAlert, trackAlertRender]);

  const isConfirmed = selectedAlert
    ? isAlertConfirmed(selectedAlert.key)
    : false;
  const acknowledgementRequired = selectedAlert
    ? requiresAcknowledgement(selectedAlert)
    : false;

  const handleCheckboxClick = useCallback(() => {
    if (selectedAlert) {
      setAlertConfirmed(selectedAlert.key, !isConfirmed);
    }
  }, [isConfirmed, selectedAlert, setAlertConfirmed]);

  if (!selectedAlert) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={handleClose}
      data-testid="alert-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={showCloseIcon ? handleClose : undefined}
          startAccessory={headerStartAccessory}
          paddingBottom={0}
          display={headerStartAccessory ? Display.InlineFlex : Display.Block}
          closeButtonProps={{
            'data-testid': 'alert-modal-close-button',
          }}
          endAccessory={showCloseIcon ? undefined : null} // Override endAccessory to omit the close icon
        />
        <AlertHeader selectedAlert={selectedAlert} customTitle={customTitle} />
        <ModalBody>
          {selectedAlert.provider === SecurityProvider.Blockaid ? (
            <BlockaidAlertDetails />
          ) : (
            <AlertDetails
              selectedAlert={selectedAlert}
              customDetails={customDetails}
            />
          )}
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
            className="flex w-full"
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            paddingTop={2}
          >
            {customAcknowledgeButton ?? (
              <>
                <AcknowledgeButton
                  onAcknowledgeClick={
                    selectedAlert.customAcknowledgeButtonOnClick ??
                    onAcknowledgeClick
                  }
                  isConfirmed={acknowledgementRequired ? isConfirmed : true}
                  hasActions={Boolean(selectedAlert.actions)}
                  isBlocking={selectedAlert.isBlocking}
                  label={selectedAlert.customAcknowledgeButtonText}
                />
                {(selectedAlert.actions ?? []).map(
                  (action: { key: string; label: string }) => (
                    <ActionButton
                      key={action.key}
                      action={action}
                      onClose={handleClose}
                      alertKey={selectedAlert.key}
                    />
                  ),
                )}
              </>
            )}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
