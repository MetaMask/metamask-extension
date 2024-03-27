import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../../components/component-library';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useAlerts from '../../../hooks/useAlerts';
import { AlertModal } from '../alert-modal';

export type MultipleAlertModalProps = {
  /** The unique identifier of the entity that owns the alert. */
  ownerId: string;
  /** The function to be executed when the button in the alert modal is clicked. */
  onButtonClick: () => void;
  /** The unique key representing the specific alert field. */
  alertKey: string;
  /** The function to be executed when the modal needs to be closed. */
  onClose: () => void;
};

export function MultipleAlertModal({
  ownerId,
  onButtonClick,
  alertKey,
  onClose,
}: MultipleAlertModalProps) {
  const t = useI18nContext();
  const { alerts, isAlertConfirmed } = useAlerts(ownerId);

  const unconfirmedAlerts = useMemo(() => {
    return alerts.filter((alert) => !isAlertConfirmed(alert.key));
  }, [alerts, isAlertConfirmed]);

  const [selectedIndex, setSelectedIndex] = useState(
    unconfirmedAlerts.findIndex((alert) => alert.key === alertKey),
  );

  const selectedAlert = useMemo(
    () => unconfirmedAlerts[selectedIndex],
    [unconfirmedAlerts, selectedIndex],
  );

  const onBack = useCallback(() => {
    setSelectedIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : unconfirmedAlerts.length - 1,
    );
  }, [unconfirmedAlerts]);

  const onNext = useCallback(() => {
    setSelectedIndex((prevIndex) =>
      prevIndex < unconfirmedAlerts.length - 1 ? prevIndex + 1 : 0,
    );
  }, [unconfirmedAlerts]);

  const handleButtonClick = useCallback(() => {
    if (unconfirmedAlerts.length === 1) {
      onButtonClick();
      return;
    }

    setSelectedIndex(
      selectedIndex >= unconfirmedAlerts.length - 1
        ? selectedIndex - 1
        : selectedIndex,
    );
  }, [onButtonClick, onNext, selectedIndex, alerts, unconfirmedAlerts]);

  return (
    <AlertModal
      ownerId={ownerId}
      onButtonClick={handleButtonClick}
      alertKey={selectedAlert.key}
      onClose={onClose}
      multipleAlerts={
        unconfirmedAlerts.length > 1 ? (
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
            >{`${selectedIndex + 1} ${t('ofTextNofM')} ${
              unconfirmedAlerts.length
            }`}</Text>
            {selectedIndex + 1 < unconfirmedAlerts.length ? (
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
