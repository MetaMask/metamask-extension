import React, { useCallback, useState } from 'react';
import { ButtonVariant } from '@metamask/snaps-sdk';
import {
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
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
import { useAlertActionHandler } from '../multiple-alert-modal/multiple-alert-modal';

export type FrictionModalConfig = {
  /** Callback function that is called when the alert link is clicked. */
  onAlertLinkClick?: () => void;
  /** Callback function that is called when the cancel button is clicked. */
  onCancel?: () => void;
  /** Callback function that is called when the submit button is clicked. */
  onSubmit?: () => void;
};

export type AlertModalProps = {
  /** The unique key representing the specific alert field. */
  alertKey: string;
  /**
   * The configuration for the friction modal.
   * Once this property is used, it enables the friction modal.
   */
  frictionModalConfig?: FrictionModalConfig;
  /**
   * The start (left) content area of ModalHeader.
   * It override `startAccessory` of ModalHeaderDefault and by default no content is present.
   */
  headerStartAccessory?: React.ReactNode;
  /** The function invoked when the user acknowledges the alert. */
  onAcknowledgeClick: () => void;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
  /** The owner ID of the relevant alert from the `confirmAlerts` reducer. */
  ownerId: string;
};

export type AlertChildrenDefaultProps = {
  selectedAlert: Alert;
  isFrictionModal: boolean;
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

function AlertHeader({
  selectedAlert,
  isFrictionModal,
}: AlertChildrenDefaultProps) {
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
          {isFrictionModal
            ? t('alertModalFrictionTitle')
            : selectedAlert.reason ?? t('alert')}
        </Text>
      </Box>
    </>
  );
}

function FrictionDetails({
  onFrictionLinkClick,
}: {
  onFrictionLinkClick?: () => void;
}) {
  const t = useI18nContext();
  return (
    <>
      <Box alignItems={AlignItems.center} textAlign={TextAlign.Center}>
        <Text variant={TextVariant.bodySm}>
          {t('alertModalFrictionDetails')}
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
          onClick={onFrictionLinkClick}
          target="_blank"
          rel="noopener noreferrer"
          data-testid={'alert-modal-review-all-alerts'}
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

function AlertDetails({
  selectedAlert,
  isFrictionModal,
  onFrictionLinkClick,
}: AlertChildrenDefaultProps & {
  onFrictionLinkClick?: () => void;
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
        backgroundColor={isFrictionModal ? undefined : severityStyle.background}
        gap={2}
        borderRadius={BorderRadius.SM}
      >
        {isFrictionModal ? (
          <FrictionDetails onFrictionLinkClick={onFrictionLinkClick} />
        ) : (
          <>
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
          </>
        )}
      </Box>
    </>
  );
}

function AcknowledgeCheckbox({
  selectedAlert,
  setAlertConfirmed,
  isConfirmed,
  isFrictionModal,
  setFrictionCheckbox,
}: AlertChildrenDefaultProps & {
  setAlertConfirmed: (alertKey: string, isConfirmed: boolean) => void;
  isConfirmed: boolean;
  setFrictionCheckbox: (value: boolean) => void;
}) {
  if (!isFrictionModal && selectedAlert.isBlocking) {
    return null;
  }

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
        label={
          isFrictionModal
            ? t('alertModalFrictionAcknowledge')
            : t('alertModalAcknowledge')
        }
        data-testid="alert-modal-acknowledge-checkbox"
        isChecked={isConfirmed}
        onChange={
          isFrictionModal
            ? () => setFrictionCheckbox(!isConfirmed)
            : handleCheckboxClick
        }
        alignItems={AlignItems.flexStart}
        className={'alert-modal__acknowledge-checkbox'}
      />
    </Box>
  );
}

function FrictionButtons({
  onCancel,
  onSubmit,
  isConfirmed,
}: {
  onCancel?: () => void;
  onSubmit?: () => void;
  isConfirmed: boolean;
}) {
  const t = useI18nContext();
  return (
    <>
      <Button
        block
        onClick={onCancel}
        size={ButtonSize.Lg}
        variant={ButtonVariant.Secondary}
        data-testid="alert-modal-cancel-button"
      >
        {t('cancel')}
      </Button>
      <Button
        variant={ButtonVariant.Primary}
        onClick={onSubmit}
        size={ButtonSize.Lg}
        data-testid="alert-modal-submit-button"
        disabled={!isConfirmed}
        danger
      >
        {t('confirm')}
      </Button>
    </>
  );
}

function AcknowledgeButton({
  onAcknowledgeClick,
  isConfirmed,
  frictionModalConfig,
  hasActions,
  isBlocking,
}: {
  onAcknowledgeClick: () => void;
  isConfirmed: boolean;
  frictionModalConfig?: FrictionModalConfig;
  hasActions?: boolean;
  isBlocking?: boolean;
}) {
  const t = useI18nContext();
  const isFrictionModal = Boolean(frictionModalConfig);

  if (isFrictionModal) {
    return (
      <FrictionButtons
        onCancel={frictionModalConfig?.onCancel}
        onSubmit={frictionModalConfig?.onSubmit}
        isConfirmed={isConfirmed}
      />
    );
  }

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
  frictionModalConfig,
}: AlertModalProps) {
  const { alerts, isAlertConfirmed, setAlertConfirmed } = useAlerts(ownerId);
  const isFrictionModal = Boolean(frictionModalConfig);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const selectedAlert = alerts.find((alert) => alert.key === alertKey);

  if (!selectedAlert) {
    return null;
  }
  const isConfirmed = isAlertConfirmed(selectedAlert.key);
  const [frictionCheckbox, setFrictionCheckbox] = useState<boolean>(false);
  const defaultAlertChildrenProps = {
    selectedAlert,
    isFrictionModal,
  };

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
        <AlertHeader {...defaultAlertChildrenProps} />
        <ModalBody>
          <AlertDetails
            onFrictionLinkClick={frictionModalConfig?.onAlertLinkClick}
            {...defaultAlertChildrenProps}
          />
          <AcknowledgeCheckbox
            isConfirmed={isFrictionModal ? frictionCheckbox : isConfirmed}
            setAlertConfirmed={setAlertConfirmed}
            setFrictionCheckbox={setFrictionCheckbox}
            {...defaultAlertChildrenProps}
          />
        </ModalBody>
        <ModalFooter>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
            width={BlockSize.Full}
          >
            <AcknowledgeButton
              onAcknowledgeClick={onAcknowledgeClick}
              isConfirmed={isFrictionModal ? frictionCheckbox : isConfirmed}
              frictionModalConfig={frictionModalConfig}
              hasActions={Boolean(selectedAlert.actions)}
              isBlocking={selectedAlert.isBlocking}
            />
            {(selectedAlert.actions ?? []).map((action) => (
              <ActionButton key={action.key} action={action} />
            ))}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
