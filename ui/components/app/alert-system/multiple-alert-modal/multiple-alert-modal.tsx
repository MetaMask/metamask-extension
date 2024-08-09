import React, { useCallback, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  Severity,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import useAlerts from '../../../../hooks/useAlerts';
import { AlertModal } from '../alert-modal';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';

export type MultipleAlertModalProps = {
  /** The key of the initial alert to display. */
  alertKey?: string;
  /** The function to be executed when the button in the alert modal is clicked. */
  onFinalAcknowledgeClick: () => void;
  /** The function to be executed when the modal needs to be closed. */
  onClose: (request?: { recursive?: boolean }) => void;
  /** The unique identifier of the entity that owns the alert. */
  ownerId: string;
};

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
    <Box display={Display.Flex} alignItems={AlignItems.center}>
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
  onClose,
  onFinalAcknowledgeClick,
  ownerId,
}: MultipleAlertModalProps) {
  const { isAlertConfirmed, alerts } = useAlerts(ownerId);

  const initialAlertIndex = alerts.findIndex(
    (alert: Alert) => alert.key === alertKey,
  );

  const [selectedIndex, setSelectedIndex] = useState(
    initialAlertIndex === -1 ? 0 : initialAlertIndex,
  );

  const selectedAlert = alerts[selectedIndex];
  const hasUnconfirmedAlerts = alerts.some(
    (alert: Alert) =>
      !isAlertConfirmed(alert.key) && alert.severity === Severity.Danger,
  );

  const handleBackButtonClick = useCallback(() => {
    setSelectedIndex((prevIndex: number) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex,
    );
  }, []);

  const handleNextButtonClick = useCallback(() => {
    setSelectedIndex((prevIndex: number) => prevIndex + 1);
  }, []);

  const handleAcknowledgeClick = useCallback(() => {
    if (selectedIndex + 1 === alerts.length) {
      if (!hasUnconfirmedAlerts) {
        onFinalAcknowledgeClick();
        return;
      }

      setSelectedIndex(0);
      return;
    }
    handleNextButtonClick();
  }, [
    onFinalAcknowledgeClick,
    handleNextButtonClick,
    selectedIndex,
    alerts.length,
    hasUnconfirmedAlerts,
  ]);

  return (
    <AlertModal
      ownerId={ownerId}
      onAcknowledgeClick={handleAcknowledgeClick}
      alertKey={selectedAlert.key}
      onClose={onClose}
      headerStartAccessory={
        <PageNavigation
          alerts={alerts}
          onBackButtonClick={handleBackButtonClick}
          onNextButtonClick={handleNextButtonClick}
          selectedIndex={selectedIndex}
        />
      }
    />
  );
}
