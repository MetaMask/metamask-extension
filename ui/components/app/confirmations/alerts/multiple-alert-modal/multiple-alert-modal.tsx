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

export type MultipleAlertModalProps = {
  /** The unique identifier of the entity that owns the alert. */
  ownerId: string;
  /** The function to be executed when the button in the alert modal is clicked. */
  onAcknowledgeClick: () => void;
  /** The unique key representing the specific alert field. */
  alertKey: string;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
};

export function MultipleAlertModal({
  ownerId,
  onAcknowledgeClick,
  alertKey,
  onClose,
}: MultipleAlertModalProps) {
  const t = useI18nContext();
  const { alerts } = useAlerts(ownerId);

  const [selectedIndex, setSelectedIndex] = useState(
    alerts.findIndex((alert) => alert.key === alertKey),
  );

  const selectedAlert = useMemo(
    () => alerts[selectedIndex],
    [alerts, selectedIndex],
  );

  const onBack = useCallback(() => {
    setSelectedIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : alerts.length - 1,
    );
  }, [alerts]);

  const onNext = useCallback(() => {
    setSelectedIndex((prevIndex) =>
      prevIndex < alerts.length - 1 ? prevIndex + 1 : 0,
    );
  }, [alerts]);

  const handleAcknowledgeClick = useCallback(() => {
    if (selectedIndex + 1 === alerts.length) {
      onAcknowledgeClick();
      return;
    }

    onNext();
  }, [onAcknowledgeClick, onNext, selectedIndex, alerts]);

  return (
    <AlertModal
      ownerId={ownerId}
      onAcknowledgeClick={handleAcknowledgeClick}
      alertKey={selectedAlert.key}
      onClose={onClose}
      multipleAlerts={
        alerts.length > 1 ? (
          <Box display={Display.Flex}>
            {selectedIndex + 1 > 1 ? (
              <ButtonIcon
                iconName={IconName.ArrowLeft}
                ariaLabel={t('back')}
                size={ButtonIconSize.Sm}
                onClick={onBack}
                className={'multiple-alert-modal__arrow-buttons'}
                data-testid="alert-modal-back-button"
              />
            ) : null}
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              className={'multiple-alert-modal__text'}
            >{`${selectedIndex + 1} ${t('ofTextNofM')} ${alerts.length}`}</Text>
            {selectedIndex + 1 < alerts.length ? (
              <ButtonIcon
                iconName={IconName.ArrowRight}
                ariaLabel={t('next')}
                size={ButtonIconSize.Sm}
                onClick={onNext}
                className={'multiple-alert-modal__arrow-buttons'}
                data-testid="alert-modal-next-button"
              />
            ) : null}
          </Box>
        ) : null
      }
    />
  );
}
