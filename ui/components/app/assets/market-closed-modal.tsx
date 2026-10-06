import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  TextButton,
  ButtonVariant,
  Text,
  TextAlign,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';

import { Modal } from '../../component-library/modal/modal';
import { ModalBody } from '../../component-library/modal-body/modal-body';
import { ModalContent } from '../../component-library/modal-content/modal-content';
import { ModalFooter } from '../../component-library/modal-footer/modal-footer';
import { ModalHeader } from '../../component-library/modal-header/modal-header';
import { ModalOverlay } from '../../component-library/modal-overlay/modal-overlay';

import { AlignItems } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

const MARKET_CLOSED_LEARN_MORE_URL = 'https://status.ondo.finance/market';

type MarketClosedModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MarketClosedModal = ({
  isOpen,
  onClose,
}: MarketClosedModalProps) => {
  const t = useI18nContext();

  return (
    <Modal isOpen={isOpen} onClose={onClose} data-testid="market-closed-modal">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          {t('bridgeMarketClosedModalTitle')}
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextDefault}
              textAlign={TextAlign.Left}
            >
              {t('bridgeMarketClosedModalDescription')}&nbsp;
              <TextButton
                asChild
                data-testid="market-closed-modal-learn-more"
                textProps={{
                  variant: TextVariant.BodyMd,
                }}
                style={{
                  alignItems: AlignItems.flexStart,
                }}
              >
                <a
                  href={MARKET_CLOSED_LEARN_MORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('bridgeMarketClosedModalLearnMore')}
                </a>
              </TextButton>
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button
            isFullWidth
            variant={ButtonVariant.Secondary}
            onClick={onClose}
            data-testid="market-closed-modal-close"
          >
            {t('done')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
