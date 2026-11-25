import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const MARKET_INSIGHTS_DISCLAIMER_MODAL_TEST_ID =
  'market-insights-disclaimer-modal';

type MarketInsightsDisclaimerModalProps = {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Called when the modal is dismissed. */
  onClose: () => void;
};

/**
 * Modal explaining that Market Insights are AI-generated and should not be
 * taken as financial advice.
 */
export const MarketInsightsDisclaimerModal = ({
  isOpen,
  onClose,
}: MarketInsightsDisclaimerModalProps) => {
  const t = useI18nContext();

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid={MARKET_INSIGHTS_DISCLAIMER_MODAL_TEST_ID}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text variant={TextVariant.HeadingSm}>
            {t('marketInsightsDisclaimerTitle')}
          </Text>
          <Text variant={TextVariant.BodySm} className="mt-4">
            {t('marketInsightsDisclaimerBody')}
          </Text>
        </ModalHeader>
        <Box marginTop={4} paddingLeft={4} paddingRight={4}>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onClose}
            data-testid="market-insights-disclaimer-got-it"
          >
            {t('gotIt')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};
