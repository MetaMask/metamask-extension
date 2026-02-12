import React from 'react';
import { useSelector } from 'react-redux';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
} from '../../component-library';
import {
  getSelectedAddress,
  selectNetworkConfigurationByChainId,
} from '../../../selectors/selectors';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { ApprovalDetails } from './activity-details-content/approval-details';
import { ReceiveDetails } from './activity-details-content/receive-details';
import { SwapDetails } from './activity-details-content/swap-details';
import { TransferDetails } from './activity-details-content/transfer-details';

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
  const selectedAddress = useSelector(getSelectedAddress)?.toLowerCase();

  const chainIdHex = `0x${transaction?.chainId.toString(16)}`;
  const nativeCurrency = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainIdHex),
  )?.nativeCurrency;

  if (!transaction) {
    return null;
  }

  console.log('transaction', transaction);

  const isSwap = transaction.category === TransactionGroupCategory.swap;
  const isBridge = transaction.transactionType === 'BRIDGE';
  const isReceive = transaction.category === TransactionGroupCategory.receive;
  const isApproval = transaction.category === TransactionGroupCategory.approval;

  const commonProps = {
    transaction,
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
            {isReceive && <ReceiveDetails {...commonProps} />}
            {isApproval && <ApprovalDetails {...commonProps} />}
            {!isSwap && !isBridge && !isReceive && !isApproval && (
              <TransferDetails {...commonProps} />
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
