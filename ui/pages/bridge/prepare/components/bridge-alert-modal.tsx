import React, { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  BannerAlert,
} from '@metamask/design-system-react';
import {
  BannerAlertSeverity,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AlignItems } from '../../../../helpers/constants/design-system';
import { useIsTxSubmittable } from '../../../../hooks/bridge/useIsTxSubmittable';
import {
  BridgeAppState,
  getBridgeQuotes,
  getValidationErrors,
} from '../../../../ducks/bridge/selectors';
import { Column, Row } from '../../layout';
import useSubmitBridgeTransaction from '../../hooks/useSubmitBridgeTransaction';
import { useBridgeAlerts } from '../../hooks/useBridgeAlerts';
import { type BridgeAlert } from '../types';

export const BridgeAlertModal = ({
  isOpen = false,
  variant,
  onClose,
  alertId,
}: {
  isOpen?: boolean;
  variant?: 'submit-cta' | 'alert-details';
  onClose: () => void;
  alertId?: BridgeAlert['id'];
}) => {
  const t = useI18nContext();

  const { submitBridgeTransaction, isSubmitting } =
    useSubmitBridgeTransaction();
  const isTxSubmittable = useIsTxSubmittable();

  const { confirmationAlerts, alertsById } = useBridgeAlerts();

  const { isStockMarketClosed, isQuoteExpired } = useSelector(
    (state: BridgeAppState) => getValidationErrors(state, Date.now()),
    shallowEqual,
  );

  const { activeQuote } = useSelector(getBridgeQuotes);

  const [activeAlertIndex, setActiveAlertIndex] = useState<number>(0);

  const shouldShowSubmitCTA = variant === 'submit-cta';
  const singleAlert = alertId ? [alertsById[alertId]] : [];
  const alerts = shouldShowSubmitCTA ? confirmationAlerts : singleAlert;
  const activeAlert = alerts[activeAlertIndex];
  const modalTitle = activeAlert?.modalProps?.title ?? activeAlert?.title;
  const modalDescription =
    activeAlert?.modalProps?.description ?? activeAlert?.description;
  const modalInfoList =
    activeAlert?.modalProps?.infoList ?? activeAlert?.infoList;
  const modalBannerErrorMessage =
    activeAlert?.modalProps?.alertModalErrorMessage;
  const isModalOpen = Boolean(
    isOpen &&
      activeAlert &&
      (shouldShowSubmitCTA ? !(isQuoteExpired || isStockMarketClosed) : true),
  );

  /**
   * Handles the user clicking the "Continue" button to view the next alert.
   * If the user is on the last alert the tx will be submitted
   */
  const handleContinue = useCallback(async () => {
    const nextAlertIndex = activeAlertIndex + 1;
    setActiveAlertIndex(nextAlertIndex);
    if (
      nextAlertIndex === alerts.length &&
      shouldShowSubmitCTA &&
      activeQuote
    ) {
      await submitBridgeTransaction(activeQuote);
    }
  }, [
    activeQuote,
    submitBridgeTransaction,
    activeAlertIndex,
    setActiveAlertIndex,
    shouldShowSubmitCTA,
    alerts.length,
  ]);

  // Reset the active alert index when the modal visibility changes
  useEffect(() => {
    setActiveAlertIndex(0);
    if (!isModalOpen) {
      onClose();
    }
  }, [isModalOpen]);

  return activeAlert ? (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      isClosedOnEscapeKey={!shouldShowSubmitCTA}
      isClosedOnOutsideClick={!shouldShowSubmitCTA}
      data-testid="bridge-alert-modal"
      className="bridge-alert-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            disabled: isSubmitting && !shouldShowSubmitCTA,
          }}
        >
          <Column alignItems={AlignItems.center} gap={2}>
            <Icon
              name={
                activeAlert.severity === 'danger'
                  ? IconName.Danger
                  : IconName.Warning
              }
              size={IconSize.Xl}
              color={
                activeAlert.severity === 'danger'
                  ? IconColor.ErrorDefault
                  : IconColor.WarningDefault
              }
            />
            {modalTitle && (
              <Text variant={TextVariant.HeadingSm}>{modalTitle}</Text>
            )}
          </Column>
        </ModalHeader>
        <Column gap={3} paddingInline={4} paddingBottom={4}>
          <Text variant={TextVariant.BodySm}>{modalDescription}</Text>
          <Column>
            {modalInfoList?.map((item) => (
              <Row
                key={item.title}
                paddingTop={2}
                paddingBottom={2}
                gap={3}
                alignItems={AlignItems.center}
              >
                <Icon
                  name={
                    activeAlert.severity === 'danger'
                      ? IconName.Danger
                      : IconName.Warning
                  }
                  size={IconSize.Md}
                  color={
                    activeAlert.severity === 'danger'
                      ? IconColor.ErrorDefault
                      : IconColor.WarningDefault
                  }
                />
                <Column>
                  <Text variant={TextVariant.BodyMd}>{item.title}</Text>
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.TextAlternative}
                  >
                    {item.description}
                  </Text>
                </Column>
              </Row>
            ))}
          </Column>
          {modalBannerErrorMessage && (
            <BannerAlert
              data-testid="bridge-alert-modal-banner"
              severity={BannerAlertSeverity.Danger}
              description={modalBannerErrorMessage}
            />
          )}
        </Column>
        <ModalFooter>
          <Row gap={4}>
            {shouldShowSubmitCTA && (
              <Button
                isFullWidth
                size={ButtonSize.Lg}
                variant={ButtonVariant.Secondary}
                disabled={isSubmitting || !isTxSubmittable}
                isLoading={isSubmitting}
                onClick={handleContinue}
                data-testid="bridge-alert-modal-proceed-button"
              >
                {t('proceed')}
              </Button>
            )}
            <Button
              isFullWidth
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              disabled={isSubmitting}
              onClick={() => {
                onClose();
              }}
              data-testid="bridge-alert-modal-cancel-button"
            >
              {t(shouldShowSubmitCTA ? 'cancel' : 'gotIt')}
            </Button>
          </Row>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ) : null;
};
