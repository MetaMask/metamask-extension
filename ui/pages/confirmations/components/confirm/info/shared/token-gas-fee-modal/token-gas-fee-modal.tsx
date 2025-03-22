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
import { TokenGasFeeListItem } from '../token-gas-fee-list-item';

export function TokenGasFeeModal({ onClose }: { onClose: () => void }) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { gasFeeTokens } = currentConfirmation;
  const { id: transactionId, selectedGasFeeToken } = currentConfirmation;

  const handleTokenClick = useCallback(
    async (_token: GasFeeToken) => {
      onClose();
    },
    [transactionId, onClose],
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
    >
      <ModalOverlay data-testid="modal-overlay" />
      <ModalContent size={ModalContentSize.Md}>
        <ModalHeader onClose={onClose}>Select a token</ModalHeader>
        <ModalBody
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          paddingLeft={0}
          paddingRight={0}
        >
          {gasFeeTokens?.map((token, index) => (
            <TokenGasFeeListItem
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
