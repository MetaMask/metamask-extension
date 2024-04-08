import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAlerts from '../../../../../hooks/useAlerts';
import { AlertModal } from '../alert-modal';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';

export type MultipleAlertModalProps = {
  /** The key of the initial alert to display. */
  alertKey: string;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
  /** The function to be executed when the button in the alert modal is clicked. */
  onFinalAcknowledgeClick: () => void;
  /** The unique identifier of the entity that owns the alert. */
  ownerId: string;
};

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
  const t = useI18nContext();
  const showPreviousButton = selectedIndex + 1 > 1;
  const showNextButton = selectedIndex + 1 < alerts.length;

  function PreviousButton() {
    if (!showPreviousButton) {
      return null;
    }

    return (
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Sm}
        onClick={onBackButtonClick}
        className={'multiple-alert-modal__arrow-buttons'}
        data-testid="alert-modal-back-button"
      />
    );
  }

  function NextButton() {
    if (!showNextButton) {
      return null;
    }

    return (
      <ButtonIcon
        iconName={IconName.ArrowRight}
        ariaLabel={t('next')}
        size={ButtonIconSize.Sm}
        onClick={onNextButtonClick}
        className={'multiple-alert-modal__arrow-buttons'}
        data-testid="alert-modal-next-button"
      />
    );
  }

  function PageNumber() {
    return (
      <Text
        variant={TextVariant.bodySm}
        color={TextColor.textAlternative}
        className={'multiple-alert-modal__text'}
      >
        {`${selectedIndex + 1} ${t('ofTextNofM')} ${alerts.length}`}
      </Text>
    );
  }

  return (
    <Box display={Display.Flex}>
      <PreviousButton />
      <PageNumber />
      <NextButton />
    </Box>
  );
}

export function MultipleAlertModal({
  alertKey,
  onClose,
  onFinalAcknowledgeClick,
  ownerId,
}: MultipleAlertModalProps) {
  const { alerts } = useAlerts(ownerId);

  const [selectedIndex, setSelectedIndex] = useState(
    alerts.findIndex((alert) => alert.key === alertKey),
  );

  const selectedAlert = useMemo(
    () => alerts[selectedIndex],
    [alerts, selectedIndex],
  );
  const onBackButtonClick = useCallback(() => {
    setSelectedIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex,
    );
  }, []);

  const onNextButtonClick = useCallback(() => {
    setSelectedIndex((prevIndex) =>
      prevIndex < alerts.length - 1 ? prevIndex + 1 : prevIndex,
    );
  }, [alerts.length]);

  const handleAcknowledgeClick = useCallback(() => {
    if (selectedIndex + 1 === alerts.length) {
      onFinalAcknowledgeClick();
      return;
    }

    onNextButtonClick();
  }, [onFinalAcknowledgeClick, onNextButtonClick, selectedIndex, alerts]);

  const renderPageNavigation = () => {
    if (alerts.length <= 1) {
      return null;
    }

    return (
      <PageNavigation
        alerts={alerts}
        onBackButtonClick={onBackButtonClick}
        onNextButtonClick={onNextButtonClick}
        selectedIndex={selectedIndex}
      />
    );
  };

  return (
    <AlertModal
      ownerId={ownerId}
      onAcknowledgeClick={handleAcknowledgeClick}
      alertKey={selectedAlert.key}
      onClose={onClose}
      headerStartAccessory={renderPageNavigation()}
    />
  );
}
