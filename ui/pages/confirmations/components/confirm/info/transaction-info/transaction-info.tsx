import { TransactionType } from '@metamask/transaction-controller';
import React from 'react';
import { useUnapprovedTransaction } from '../../../../hooks/useUnapprovedTransaction';
import ApproveInfo from '../approve/approve';
import BaseTransactionInfo from '../base-transaction-info/base-transaction-info';
import NativeTransferInfo from '../native-transfer/native-transfer';
import NFTTokenTransferInfo from '../nft-token-transfer/nft-token-transfer';
import SetApprovalForAllInfo from '../set-approval-for-all-info/set-approval-for-all-info';
import ShieldSubscriptionApproveInfo from '../shield-subscription-approve/shield-subscription-approve';
import TokenTransferInfo from '../token-transfer/token-transfer';

const TRANSACTION_INFO_COMPONENTS: Record<string, React.ComponentType> = {
  [TransactionType.batch]: BaseTransactionInfo,
  [TransactionType.contractInteraction]: BaseTransactionInfo,
  [TransactionType.deployContract]: BaseTransactionInfo,
  [TransactionType.revokeDelegation]: BaseTransactionInfo,
  [TransactionType.simpleSend]: NativeTransferInfo,
  [TransactionType.shieldSubscriptionApprove]: ShieldSubscriptionApproveInfo,
  [TransactionType.tokenMethodApprove]: ApproveInfo,
  [TransactionType.tokenMethodIncreaseAllowance]: ApproveInfo,
  [TransactionType.tokenMethodSafeTransferFrom]: NFTTokenTransferInfo,
  [TransactionType.tokenMethodSetApprovalForAll]: SetApprovalForAllInfo,
  [TransactionType.tokenMethodTransfer]: TokenTransferInfo,
  [TransactionType.tokenMethodTransferFrom]: NFTTokenTransferInfo,
};

/**
 * Renders the appropriate info component for transaction-type confirmations.
 * Uses the transaction type from the unapproved transaction to determine
 * which info component to render.
 *
 * @returns The appropriate info component for the transaction type, or null.
 */
const TransactionInfo: React.FC = () => {
  const unapprovedTransaction = useUnapprovedTransaction();

  if (!unapprovedTransaction?.type) {
    return null;
  }

  const InfoComponent = TRANSACTION_INFO_COMPONENTS[unapprovedTransaction.type];

  if (!InfoComponent) {
    return null;
  }

  return <InfoComponent />;
};

export default TransactionInfo;
