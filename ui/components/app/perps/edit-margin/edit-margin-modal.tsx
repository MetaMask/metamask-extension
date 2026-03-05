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
import type { Position, AccountState } from '../types';
import { EditMarginModalContent } from './edit-margin-modal-content';

export type EditMarginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  account: AccountState | null;
  currentPrice: number;
  selectedAddress: string;
  /** 'add' | 'remove' — modal title and content mode */
  mode: 'add' | 'remove';
};

/**
 * Modal for adding or decreasing margin on a position.
 * Title and content are single-purpose based on mode.
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.position
 * @param options0.account
 * @param options0.currentPrice
 * @param options0.selectedAddress
 * @param options0.mode
 */
export const EditMarginModal: React.FC<EditMarginModalProps> = ({
  isOpen,
  onClose,
  position,
  account,
  currentPrice,
  selectedAddress,
  mode,
}) => {
  const t = useI18nContext();
  const title = mode === 'add' ? t('perpsAddMargin') : t('perpsRemoveMargin');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid={
        mode === 'add'
          ? 'perps-add-margin-modal'
          : 'perps-decrease-margin-modal'
      }
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>{title}</ModalHeader>
        <ModalBody>
          <EditMarginModalContent
            position={position}
            account={account}
            currentPrice={currentPrice}
            selectedAddress={selectedAddress}
            mode={mode}
            onClose={onClose}
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={onClose}
            data-testid="perps-edit-margin-modal-cancel"
          >
            {t('cancel')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
