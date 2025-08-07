import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Column } from '../layout';

interface PriceImpactWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGasIncluded?: boolean;
}

export const PriceImpactWarningModal = ({
  isOpen,
  onClose,
  isGasIncluded = false,
}: PriceImpactWarningModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="price-impact-warning-modal"
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{
          padding: 0,
        }}
      >
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {t('bridgePriceImpactWarningTitle')}
          </Text>
        </ModalHeader>
        <Column gap={3} padding={4}>
          <Box
            backgroundColor={BackgroundColor.backgroundAlternative}
            padding={4}
            borderRadius={BorderRadius.LG}
          >
            <Text variant={TextVariant.bodyMd}>
              {isGasIncluded
                ? t('bridgePriceImpactGaslessWarning')
                : t('bridgePriceImpactNormalWarning')}
            </Text>
          </Box>
        </Column>
      </ModalContent>
    </Modal>
  );
};
