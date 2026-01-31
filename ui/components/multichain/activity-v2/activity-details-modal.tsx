import React from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import { useFormatters } from '../../../hooks/useFormatters';
import {
  getSelectedAddress,
  selectNetworkConfigurationByChainId,
} from '../../../selectors/selectors';
import type { TransactionViewModel } from '../../../../shared/lib/types';
import { TransferDetails } from './activity-details-content/transfer-details';
import { SwapDetails } from './activity-details-content/swap-details';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionViewModel | null;
};

export const ActivityDetailsModal = ({
  isOpen,
  onClose,
  transaction,
}: Props) => {
  const { formatToken } = useFormatters();
  const selectedAddress = useSelector(getSelectedAddress)?.toLowerCase();

  const chainIdHex = `0x${transaction?.chainId.toString(16)}`;
  const nativeCurrency = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainIdHex),
  )?.nativeCurrency;

  if (!transaction) {
    return null;
  }

  const isSwap =
    transaction.transactionType === 'SWAP' ||
    transaction.transactionProtocol?.includes('SWAP');

  const isBridge =
    transaction.transactionType === 'BRIDGE' ||
    transaction.transactionProtocol?.includes('BRIDGE');

  const commonProps = {
    transaction,
    formatToken,
    selectedAddress,
    nativeCurrency,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{transaction.readable}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            {(isSwap || isBridge) && <SwapDetails {...commonProps} />}
            {!isSwap && !isBridge && <TransferDetails {...commonProps} />}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
