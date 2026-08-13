import React, { useCallback, useState } from 'react';

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

const PreviousButton = ({
  safeIndex,
  onBack,
}: {
  safeIndex: number;
  onBack: () => void;
}) => {
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
};

const NextButton = ({
  safeIndex,
  alertsLength,
  onNext,
}: {
  safeIndex: number;
  alertsLength: number;
  onNext: () => void;
}) => {
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
};

const PageNumber = ({
  safeIndex,
  alertsLength,
}: {
  safeIndex: number;
  alertsLength: number;
}) => {
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
};

const PageNavigation = ({
  alertsLength,
  safeIndex,
  onBack,
  onNext,
}: {
  alertsLength: number;
  safeIndex: number;
  onBack: () => void;
  onNext: () => void;
}) => {
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
};

type ModalUiState = {
  isOpen: boolean;
  alertKeys: string;
  currentIndex: number;
  viewedKeys: Set<string>;
};

export const SendAlertModal = ({
  isOpen,
  alerts,
  onAcknowledge,
  onClose,
  acknowledgeLabel,
}: SendAlertModalProps) => {
  const t = useI18nContext();
  const alertKeys = alerts.map((alert) => alert.key).join('|');
  const [uiState, setUiState] = useState<ModalUiState>(() => ({
    isOpen,
    alertKeys,
    currentIndex: 0,
    viewedKeys: new Set(),
  }));

  // React-documented prop→state reset. Open changes clear viewed keys; alert
  // identity changes only rewind the index (preserve previously viewed keys).
  // Viewed-key marking happens in event handlers, not during render.
  if (isOpen !== uiState.isOpen) {
    setUiState({
      isOpen,
      alertKeys,
      currentIndex: 0,
      viewedKeys: new Set(),
    });
  } else if (alertKeys !== uiState.alertKeys) {
    setUiState((prev) => ({
      ...prev,
      alertKeys,
      currentIndex: 0,
    }));
  }

  const safeIndex = Math.min(
    uiState.currentIndex,
    Math.max(alerts.length - 1, 0),
  );
  const currentAlert = alerts[safeIndex];
  const hasMultiple = alerts.length > 1;
  const { viewedKeys } = uiState;

  const withCurrentViewed = useCallback(
    (base: Set<string>) => {
      const next = new Set(base);
      if (currentAlert) {
        next.add(currentAlert.key);
      }
      return next;
    },
    [currentAlert],
  );

  const goToPrevious = useCallback(() => {
    const nextIndex = Math.max(safeIndex - 1, 0);
    const nextViewed = withCurrentViewed(viewedKeys);
    const destination = alerts[nextIndex];
    if (destination) {
      nextViewed.add(destination.key);
    }
    setUiState((prev) => ({
      ...prev,
      currentIndex: nextIndex,
      viewedKeys: nextViewed,
    }));
  }, [alerts, safeIndex, viewedKeys, withCurrentViewed]);

  const goToNext = useCallback(() => {
    const nextIndex = Math.min(safeIndex + 1, alerts.length - 1);
    // Mark both the alert being left and the destination so a mid-flow alert
    // identity change still preserves keys the user already stepped onto.
    const nextViewed = withCurrentViewed(viewedKeys);
    const destination = alerts[nextIndex];
    if (destination) {
      nextViewed.add(destination.key);
    }
    setUiState((prev) => ({
      ...prev,
      currentIndex: nextIndex,
      viewedKeys: nextViewed,
    }));
  }, [alerts, safeIndex, viewedKeys, withCurrentViewed]);

  const isOnLastAlert = safeIndex >= Math.max(alerts.length - 1, 0);

  const handleAcknowledgeStep = useCallback(() => {
    if (!currentAlert) {
      return;
    }
    const acknowledged = withCurrentViewed(viewedKeys);
    if (isOnLastAlert) {
      onAcknowledge(Array.from(acknowledged));
      return;
    }
    const nextIndex = Math.min(safeIndex + 1, alerts.length - 1);
    const destination = alerts[nextIndex];
    if (destination) {
      acknowledged.add(destination.key);
    }
    setUiState((prev) => ({
      ...prev,
      currentIndex: nextIndex,
      viewedKeys: acknowledged,
    }));
  }, [
    alerts,
    currentAlert,
    isOnLastAlert,
    onAcknowledge,
    safeIndex,
    viewedKeys,
    withCurrentViewed,
  ]);

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
            children:
              acknowledgeLabel ??
              currentAlert.acknowledgeButtonLabel ??
              t('iUnderstand'),
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
