import React, { useRef, useCallback, useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
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
 *
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
  const saveRef = useRef<(() => void) | null>(null);
  const [saveEnabled, setSaveEnabled] = useState(false);

  const handleSave = useCallback(() => {
    saveRef.current?.();
  }, []);

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
            externalSave
            onSaveRef={saveRef}
            onSaveEnabledChange={setSaveEnabled}
          />
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          onSubmit={handleSave}
          cancelButtonProps={{
            'data-testid': 'perps-edit-margin-modal-cancel',
            children: t('cancel'),
          }}
          submitButtonProps={{
            'data-testid': 'perps-edit-margin-modal-save',
            children: t('save'),
            disabled: !saveEnabled,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
