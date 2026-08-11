import React, { useCallback, useState } from 'react';
import { Box, BoxAlignItems } from '@metamask/design-system-react';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import {
  BackgroundColor,
  BorderRadius,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import useAlerts from '../../../../hooks/useAlerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
import { AlertModal } from '../alert-modal';

export type MultipleAlertModalProps = {
  /** The key of the initial alert to display. */
  alertKey?: string;
  /** If true the modal will display non-field alerts also. */
  displayAllAlerts?: boolean;
  /** The function to be executed when the button in the alert modal is clicked. */
  onFinalAcknowledgeClick: () => void;
  /** The function to be executed when the modal needs to be closed. */
  onClose: (request?: { recursive?: boolean }) => void;
  /** The unique identifier of the entity that owns the alert. */
  ownerId: string;
  /** Whether to show the close icon in the modal header. */
  showCloseIcon?: boolean;
  /** Whether to skip the unconfirmed alerts validation and close the modal directly. */
  skipAlertNavigation?: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function PreviousButton({
  selectedIndex,
  onBackButtonClick,
}: {
  selectedIndex: number;
  onBackButtonClick: () => void;
}) {
  const t = useI18nContext();
  const showPreviousButton = selectedIndex + 1 > 1;
  if (!showPreviousButton) {
    return null;
  }

  return (
    <ButtonIcon
      iconName={IconName.ArrowLeft}
      ariaLabel={t('back')}
      size={ButtonIconSize.Sm}
      onClick={onBackButtonClick}
      className="confirm_nav__left_btn"
      data-testid="alert-modal-back-button"
      borderRadius={BorderRadius.full}
      color={IconColor.iconAlternative}
      backgroundColor={BackgroundColor.backgroundAlternative}
    />
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function NextButton({
  selectedIndex,
  alertsLength,
  onNextButtonClick,
}: {
  selectedIndex: number;
  alertsLength: number;
  onNextButtonClick: () => void;
}) {
  const t = useI18nContext();
  const showNextButton = selectedIndex + 1 < alertsLength;
  if (!showNextButton) {
    return null;
  }

  return (
    <ButtonIcon
      iconName={IconName.ArrowRight}
      ariaLabel={t('next')}
      size={ButtonIconSize.Sm}
      onClick={onNextButtonClick}
      className="confirm_nav__right_btn"
      data-testid="alert-modal-next-button"
      borderRadius={BorderRadius.full}
      color={IconColor.iconAlternative}
      backgroundColor={BackgroundColor.backgroundAlternative}
    />
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function PageNumber({
  selectedIndex,
  alertsLength,
}: {
  selectedIndex: number;
  alertsLength: number;
}) {
  const t = useI18nContext();
  return (
    <Text
      variant={TextVariant.bodySm}
      color={TextColor.textAlternative}
      marginInline={1}
      style={{ whiteSpace: 'nowrap' }}
    >
      {`${selectedIndex + 1} ${t('ofTextNofM')} ${alertsLength}`}
    </Text>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function PageNavigation({
  alerts,
  onBackButtonClick,
  onNextButtonClick,
  selectedIndex,
}: {
  alerts: Alert[];
  onBackButtonClick: () => void;
  onNextButtonClick: () => void;
  selectedIndex: number;
}) {
  if (alerts.length <= 1) {
    return null;
  }
  return (
    <Box className="flex" alignItems={BoxAlignItems.Center}>
      <PreviousButton
        selectedIndex={selectedIndex}
        onBackButtonClick={onBackButtonClick}
      />
      <PageNumber selectedIndex={selectedIndex} alertsLength={alerts.length} />
      <NextButton
        selectedIndex={selectedIndex}
        alertsLength={alerts.length}
        onNextButtonClick={onNextButtonClick}
      />
    </Box>
  );
}

export function MultipleAlertModal({
  alertKey,
  displayAllAlerts = false,
  onClose,
  onFinalAcknowledgeClick,
  ownerId,
  showCloseIcon = true,
  skipAlertNavigation = false,
}: MultipleAlertModalProps) {
  const {
    alerts: alertsFromHook,
    fieldAlerts: fieldAlertsFromHook,
    navigableAlerts: navigableAlertsFromHook,
    navigableFieldAlerts: navigableFieldAlertsFromHook,
  } = useAlerts(ownerId);

  const alerts = alertsFromHook ?? [];
  const fieldAlerts = fieldAlertsFromHook ?? [];
  const navigableAlerts = navigableAlertsFromHook ?? alerts;
  const navigableFieldAlerts = navigableFieldAlertsFromHook ?? fieldAlerts;

  const alertsToDisplay = displayAllAlerts ? alerts : fieldAlerts;
  const navigableAlertsToDisplay = displayAllAlerts
    ? navigableAlerts
    : navigableFieldAlerts;

  const initialAlertKey =
    alertsToDisplay.find((alert) => alert.key === alertKey)?.key ??
    navigableAlertsToDisplay[0]?.key ??
    alertsToDisplay[0]?.key;

  const [currentAlertKey, setCurrentAlertKey] = useState<string | undefined>(
    initialAlertKey,
  );
  const [pendingAlertKey, setPendingAlertKey] = useState<string | undefined>();
  const [prevAlertKey, setPrevAlertKey] = useState(alertKey);
  const alertsKeyFingerprint = alertsToDisplay
    .map((alert) => alert.key)
    .join('|');
  const navigableAlertsKeyFingerprint = navigableAlertsToDisplay
    .map((alert) => alert.key)
    .join('|');
  const [prevAlertsKeyFingerprint, setPrevAlertsKeyFingerprint] =
    useState(alertsKeyFingerprint);
  const [
    prevNavigableAlertsKeyFingerprint,
    setPrevNavigableAlertsKeyFingerprint,
  ] = useState(navigableAlertsKeyFingerprint);

  if (
    alertKey !== prevAlertKey ||
    alertsKeyFingerprint !== prevAlertsKeyFingerprint ||
    navigableAlertsKeyFingerprint !== prevNavigableAlertsKeyFingerprint
  ) {
    const alertKeyChanged = alertKey !== prevAlertKey;
    setPrevAlertKey(alertKey);
    setPrevAlertsKeyFingerprint(alertsKeyFingerprint);
    setPrevNavigableAlertsKeyFingerprint(navigableAlertsKeyFingerprint);

    const alertKeyExists = alertKey
      ? alertsToDisplay.some((alert) => alert.key === alertKey)
      : false;

    let nextPendingAlertKey = pendingAlertKey;
    let nextCurrentAlertKey = currentAlertKey;

    if (alertKeyChanged) {
      if (alertKeyExists && alertKey) {
        nextCurrentAlertKey = alertKey;
        nextPendingAlertKey = undefined;
      } else {
        nextPendingAlertKey = alertKey ?? undefined;
      }
    }

    if (
      nextPendingAlertKey &&
      alertsToDisplay.some((alert) => alert.key === nextPendingAlertKey)
    ) {
      nextCurrentAlertKey = nextPendingAlertKey;
      nextPendingAlertKey = undefined;
    }

    const currentAlertStillExists = nextCurrentAlertKey
      ? alertsToDisplay.some((alert) => alert.key === nextCurrentAlertKey)
      : false;

    if (!currentAlertStillExists) {
      const pendingAlertExists = nextPendingAlertKey
        ? alertsToDisplay.some((alert) => alert.key === nextPendingAlertKey)
        : false;

      nextCurrentAlertKey =
        (alertKeyExists ? alertKey : undefined) ??
        (pendingAlertExists ? nextPendingAlertKey : undefined) ??
        navigableAlertsToDisplay[0]?.key ??
        alertsToDisplay[0]?.key;

      if (pendingAlertExists && nextCurrentAlertKey === nextPendingAlertKey) {
        nextPendingAlertKey = undefined;
      }
    }

    if (nextCurrentAlertKey !== currentAlertKey) {
      setCurrentAlertKey(nextCurrentAlertKey);
    }
    if (nextPendingAlertKey !== pendingAlertKey) {
      setPendingAlertKey(nextPendingAlertKey);
    }
  }

  const selectedAlert =
    alertsToDisplay.find((alert) => alert.key === currentAlertKey) ??
    alertsToDisplay[0];

  const currentNavigableIndex = navigableAlertsToDisplay.findIndex(
    (alert) => alert.key === (selectedAlert?.key ?? currentAlertKey),
  );

  const handleBackButtonClick = useCallback(() => {
    const activeAlertKey = selectedAlert?.key ?? currentAlertKey;
    const newIndex = navigableAlertsToDisplay.findIndex(
      (alert) => alert.key === activeAlertKey,
    );

    if (newIndex > 0) {
      setCurrentAlertKey(navigableAlertsToDisplay[newIndex - 1]?.key);
    }
  }, [currentAlertKey, navigableAlertsToDisplay, selectedAlert]);

  const handleNextButtonClick = useCallback(() => {
    const activeAlertKey = selectedAlert?.key ?? currentAlertKey;
    const newIndex = navigableAlertsToDisplay.findIndex(
      (alert) => alert.key === activeAlertKey,
    );

    if (
      newIndex !== -1 &&
      newIndex + 1 < navigableAlertsToDisplay.length &&
      navigableAlertsToDisplay[newIndex + 1]?.key
    ) {
      setCurrentAlertKey(navigableAlertsToDisplay[newIndex + 1]?.key);
    }
  }, [currentAlertKey, navigableAlertsToDisplay, selectedAlert]);

  const handleAcknowledgeClick = useCallback(() => {
    onFinalAcknowledgeClick();
  }, [onFinalAcknowledgeClick]);

  const showNavigationButtons =
    !skipAlertNavigation &&
    selectedAlert?.hideFromAlertNavigation !== true &&
    currentNavigableIndex !== -1 &&
    navigableAlertsToDisplay.length > 1;

  return (
    <AlertModal
      ownerId={ownerId}
      onAcknowledgeClick={handleAcknowledgeClick}
      alertKey={selectedAlert?.key}
      onClose={onClose}
      headerStartAccessory={
        showNavigationButtons ? (
          <PageNavigation
            alerts={navigableAlertsToDisplay}
            onBackButtonClick={handleBackButtonClick}
            onNextButtonClick={handleNextButtonClick}
            selectedIndex={currentNavigableIndex}
          />
        ) : null
      }
      showCloseIcon={showCloseIcon}
    />
  );
}
