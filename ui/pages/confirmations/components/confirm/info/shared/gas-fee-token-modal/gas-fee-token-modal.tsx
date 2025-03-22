import React, { useCallback } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../../../helpers/constants/design-system';
import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../../context/confirm';
import { GasFeeTokenListItem } from '../gas-fee-token-list-item';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';

export function GasFeeTokenModal({ onClose }: { onClose?: () => void }) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { gasFeeTokens } = currentConfirmation;
  const { id: transactionId, selectedGasFeeToken } = currentConfirmation;

  const handleTokenClick = useCallback(
    async (_token: GasFeeToken) => {
      onClose?.();
    },
    [transactionId, onClose],
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose ?? (() => {})}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>
          {t('confirmGasFeeTokenModalTitle')}
        </ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={0}
          paddingRight={0}
        >
          {gasFeeTokens?.map((token) => (
            <GasFeeTokenListItem
              key={token.tokenAddress}
              gasFeeToken={token}
              isSelected={selectedGasFeeToken === token.tokenAddress}
              onClick={handleTokenClick}
            />
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
