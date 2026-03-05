import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { Position } from '../types';
import { UpdateTPSLModalContent } from './update-tpsl-modal-content';

export type UpdateTPSLModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  currentPrice: number;
  selectedAddress: string;
};

/**
 * Modal for updating Take Profit / Stop Loss on a position.
 * Visually matches the Edit Margin modal flow.
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.position
 * @param options0.currentPrice
 * @param options0.selectedAddress
 */
export const UpdateTPSLModal: React.FC<UpdateTPSLModalProps> = ({
  isOpen,
  onClose,
  position,
  currentPrice,
  selectedAddress,
}) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-update-tpsl-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{t('perpsAutoClose')}</ModalHeader>
        <ModalBody>
          <UpdateTPSLModalContent
            position={position}
            currentPrice={currentPrice}
            selectedAddress={selectedAddress}
            onClose={onClose}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onClose}
            data-testid="perps-update-tpsl-modal-cancel"
          >
            {t('cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
