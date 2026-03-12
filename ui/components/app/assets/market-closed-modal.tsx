import React from 'react';
import {
  Box,
  Button,
  ButtonLink,
  ButtonLinkSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
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
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
          >
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textDefault}
              textAlign={TextAlign.Left}
            >
              {t('bridgeMarketClosedModalDescription')}&nbsp;
              <ButtonLink
                data-testid="market-closed-modal-learn-more"
                size={ButtonLinkSize.Inherit}
                href={MARKET_CLOSED_LEARN_MORE_URL}
                textProps={{
                  variant: TextVariant.bodyMd,
                  alignItems: AlignItems.flexStart,
                }}
                target="_blank"
                as="a"
                rel="noopener noreferrer"
              >
                {t('bridgeMarketClosedModalLearnMore')}
              </ButtonLink>
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button
            width={BlockSize.Full}
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
