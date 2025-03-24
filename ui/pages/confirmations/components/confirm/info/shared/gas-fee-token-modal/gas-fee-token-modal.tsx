import React, { useCallback } from 'react';
import {
  GasFeeToken,
  TransactionMeta,
  BatchTransactionParams,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { Interface } from '@ethersproject/abi';
import { abiERC20 } from '@metamask/metamask-eth-abis';
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
import { NATIVE_TOKEN_ADDRESS } from '../../hooks/useGasFeeToken';
import {
  updateBatchTransactions,
  updateSelectedGasFeeToken,
} from '../../../../../../../store/actions/transaction-controller';
import { updateEditableParams } from '../../../../../../../store/actions';
import { useDispatch } from 'react-redux';

export function GasFeeTokenModal({ onClose }: { onClose?: () => void }) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const dispatch = useDispatch();

  const {
    id: transactionId,
    gasFeeTokens,
    selectedGasFeeToken,
  } = currentConfirmation;

  const handleTokenClick = useCallback(
    async (token: GasFeeToken) => {
      await updateSelectedGasFeeToken(transactionId, token.tokenAddress);

      await dispatch(
        updateEditableParams(transactionId, {
          gas: token.gas,
          maxFeePerGas: token.maxFeePerGas,
          maxPriorityFeePerGas: token.maxPriorityFeePerGas,
        }),
      );

      await updateBatchTransactions({
        transactionId,
        batchTransactions: [getTransferTransaction(token)],
      });

      onClose?.();
    },
    [onClose, transactionId],
  );

  const gasFeeTokenAddresses = [
    NATIVE_TOKEN_ADDRESS,
    ...(gasFeeTokens?.map((token) => token.tokenAddress) ?? []),
  ] as Hex[];

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

function getTransferTransaction(
  gasFeeToken: GasFeeToken,
): BatchTransactionParams {
  const data = new Interface(abiERC20).encodeFunctionData('transfer', [
    gasFeeToken.recipient,
    gasFeeToken.amount,
  ]) as Hex;

  return {
    data,
    maxFeePerGas: gasFeeToken.maxFeePerGas,
    maxPriorityFeePerGas: gasFeeToken.maxPriorityFeePerGas,
    to: gasFeeToken.tokenAddress,
  };
}
