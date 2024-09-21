import React, { useContext, useState } from 'react';

import { I18nContext } from '../../../contexts/i18n';
import {
  FlexDirection,
  Display,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalOverlay,
  Box,
  ButtonPrimary,
} from '../../../components/component-library';
import { ModalContent } from '../../../components/component-library/modal-content/deprecated';
import { ModalHeader } from '../../../components/component-library/modal-header/deprecated';
import {
  SLIPPAGE_HIGH_ERROR,
  SLIPPAGE_LOW_ERROR,
} from '../../../../shared/constants/swaps';
import SwapsBannerAlert from '../swaps-banner-alert/swaps-banner-alert';

type Props = {
  isOpen: boolean;
  slippageErrorKey: string;
  setSlippageNotificationModalOpened: (isOpen: boolean) => void;
  onSwapSubmit: (opts: { acknowledgedSlippage: boolean }) => void;
  currentSlippage: number;
};

export default function SlippageNotificationModal({
  isOpen,
  slippageErrorKey,
  setSlippageNotificationModalOpened,
  onSwapSubmit,
  currentSlippage,
}: Props) {
  const t = useContext(I18nContext);
  const [submitting, setSubmitting] = useState(false);

  const getSlippageModalTitle = () => {
    if (slippageErrorKey === SLIPPAGE_HIGH_ERROR) {
      return t('swapHighSlippage');
    } else if (slippageErrorKey === SLIPPAGE_LOW_ERROR) {
      return t('swapLowSlippage');
    }
    return '';
  };

  const primaryButtonText = submitting ? t('preparingSwap') : t('swapAnyway');

  return (
    <Modal
      onClose={() => setSlippageNotificationModalOpened(false)}
      isOpen={isOpen}
      isClosedOnOutsideClick
      isClosedOnEscapeKey
      className="mm-modal__custom-scrollbar"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={() => setSlippageNotificationModalOpened(false)}>
          {getSlippageModalTitle()}
        </ModalHeader>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.stretch}
          className="high-slippage__content"
          marginTop={7}
        >
          <SwapsBannerAlert
            swapsErrorKey={slippageErrorKey}
            showTransactionSettingsLink
            currentSlippage={currentSlippage}
          />
          <Box marginTop={5}>
            <ButtonPrimary
              onClick={() => {
                setSubmitting(true);
                onSwapSubmit({ acknowledgedSlippage: true });
              }}
              block
              data-testid="high-slippage-continue-anyway"
              disabled={submitting}
            >
              {primaryButtonText}
            </ButtonPrimary>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
