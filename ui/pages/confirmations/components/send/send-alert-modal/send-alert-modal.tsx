/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback, useEffect, useState } from 'react';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Display } from '../../../../../helpers/constants/design-system';
import { SendAlertModalProps } from './send-alert-modal.types';

const NAV_BUTTON_ICON_CLASSNAME =
  'rounded-full bg-background-alternative text-icon-alternative';

const NAV_ICON_PROPS = { size: IconSize.Sm };

function PreviousButton({
  safeIndex,
  onBack,
}: {
  safeIndex: number;
  onBack: () => void;
}) {
  const t = useI18nContext();
  if (safeIndex === 0) {
    return null;
  }
  return (
    <ButtonIcon
      iconName={IconName.ArrowLeft}
      ariaLabel={t('back')}
      iconProps={NAV_ICON_PROPS}
      onClick={onBack}
      className={`confirm_nav__left_btn ${NAV_BUTTON_ICON_CLASSNAME}`}
      data-testid="send-alert-modal-prev-button"
    />
  );
}

function NextButton({
  safeIndex,
  alertsLength,
  onNext,
}: {
  safeIndex: number;
  alertsLength: number;
  onNext: () => void;
}) {
  const t = useI18nContext();
  if (safeIndex >= alertsLength - 1) {
    return null;
  }
  return (
    <ButtonIcon
      iconName={IconName.ArrowRight}
      ariaLabel={t('next')}
      iconProps={NAV_ICON_PROPS}
      onClick={onNext}
      className={`confirm_nav__right_btn ${NAV_BUTTON_ICON_CLASSNAME}`}
      data-testid="send-alert-modal-next-button"
    />
  );
}

function PageNumber({
  safeIndex,
  alertsLength,
}: {
  safeIndex: number;
  alertsLength: number;
}) {
  const t = useI18nContext();
  return (
    <Text
      variant={TextVariant.BodySm}
      color={TextColor.TextAlternative}
      className="whitespace-nowrap mx-1"
      data-testid="send-alert-modal-page-counter"
    >
      {`${safeIndex + 1} ${t('ofTextNofM')} ${alertsLength}`}
    </Text>
  );
}

function PageNavigation({
  alertsLength,
  safeIndex,
  onBack,
  onNext,
}: {
  alertsLength: number;
  safeIndex: number;
  onBack: () => void;
  onNext: () => void;
}) {
  if (alertsLength <= 1) {
    return null;
  }
  return (
    <Box alignItems={BoxAlignItems.Center} className="flex">
      <PreviousButton safeIndex={safeIndex} onBack={onBack} />
      <PageNumber safeIndex={safeIndex} alertsLength={alertsLength} />
      <NextButton
        safeIndex={safeIndex}
        alertsLength={alertsLength}
        onNext={onNext}
      />
    </Box>
  );
}

export const SendAlertModal = ({
  isOpen,
  alerts,
  onAcknowledge,
  onClose,
}: SendAlertModalProps) => {
  const t = useI18nContext();
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeIndex = Math.min(currentIndex, Math.max(alerts.length - 1, 0));
  const currentAlert = alerts[safeIndex];
  const hasMultiple = alerts.length > 1;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, alerts.length - 1));
  }, [alerts.length]);

  const alertKeys = alerts.map((a) => a.key).join('|');

  useEffect(() => {
    setCurrentIndex(0);
  }, [isOpen, alertKeys]);

  const isOnLastAlert = safeIndex >= Math.max(alerts.length - 1, 0);

  const handleAcknowledgeStep = useCallback(() => {
    if (isOnLastAlert) {
      onAcknowledge();
      return;
    }
    goToNext();
  }, [goToNext, isOnLastAlert, onAcknowledge]);

  if (!currentAlert) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid="send-alert-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          paddingBottom={0}
          display={hasMultiple ? Display.InlineFlex : Display.Block}
          startAccessory={
            hasMultiple ? (
              <PageNavigation
                alertsLength={alerts.length}
                safeIndex={safeIndex}
                onBack={goToPrevious}
                onNext={goToNext}
              />
            ) : null
          }
          closeButtonProps={{
            'data-testid': 'send-alert-modal-close-button',
          }}
        />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          className="pb-2"
        >
          <Icon
            name={IconName.Danger}
            size={IconSize.Xl}
            color={IconColor.WarningDefault}
          />
          <Text
            variant={TextVariant.HeadingSm}
            textAlign={TextAlign.Center}
            className="mt-2"
          >
            {currentAlert.title}
          </Text>
        </Box>
        <ModalBody>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
            data-testid="send-alert-modal-message"
            className="break-words max-w-full"
            style={{ overflowWrap: 'anywhere' }}
          >
            {currentAlert.message}
          </Text>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleAcknowledgeStep}
          submitButtonProps={{
            children: currentAlert.acknowledgeButtonLabel ?? t('iUnderstand'),
            'data-testid': 'send-alert-modal-acknowledge-button',
          }}
          cancelButtonProps={{
            'data-testid': 'send-alert-modal-cancel-button',
          }}
        />
      </ModalContent>
    </Modal>
  );
};
