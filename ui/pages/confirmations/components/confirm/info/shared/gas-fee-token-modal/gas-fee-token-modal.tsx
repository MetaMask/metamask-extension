import React, { useCallback } from 'react';
import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
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
import { useConfirmContext } from '../../../../../context/confirm';
import { GasFeeTokenListItem } from '../gas-fee-token-list-item';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { updateSelectedGasFeeToken } from '../../../../../../../store/actions/transaction-controller';
import { NATIVE_TOKEN_ADDRESS } from '../../hooks/useGasFeeToken';

export function GasFeeTokenModal({ onClose }: { onClose?: () => void }) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const {
    id: transactionId,
    gasFeeTokens,
    selectedGasFeeToken,
  } = currentConfirmation;

  const handleTokenClick = useCallback(
    async (token: GasFeeToken) => {
      const selectedAddress =
        token.tokenAddress === NATIVE_TOKEN_ADDRESS
          ? undefined
          : token.tokenAddress;

      await updateSelectedGasFeeToken(transactionId, selectedAddress);

      onClose?.();
    },
    [onClose, transactionId],
  );

  const hasNativeToken = gasFeeTokens?.some(
    (token) => token.tokenAddress === NATIVE_TOKEN_ADDRESS,
  );

  const gasFeeTokenAddresses = [
    ...(hasNativeToken ? [] : [NATIVE_TOKEN_ADDRESS]),
    ...(gasFeeTokens?.map((token) => token.tokenAddress) ?? []),
  ];

  return (
    <Modal
      isOpen={true}
      onClose={
        onClose ??
        (() => {
          // Intentionally empty
        })
      }
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
          {gasFeeTokenAddresses.map((tokenAddress) => (
            <GasFeeTokenListItem
              key={tokenAddress}
              tokenAddress={tokenAddress}
              isSelected={
                selectedGasFeeToken?.toLowerCase() ===
                  tokenAddress.toLowerCase() ||
                (!selectedGasFeeToken && tokenAddress === NATIVE_TOKEN_ADDRESS)
              }
              onClick={handleTokenClick}
            />
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
