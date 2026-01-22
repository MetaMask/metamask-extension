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

  switch (unapprovedTransaction.type) {
    case TransactionType.batch:
    case TransactionType.contractInteraction:
    case TransactionType.deployContract:
    case TransactionType.revokeDelegation:
      return <BaseTransactionInfo />;

    case TransactionType.simpleSend:
      return <NativeTransferInfo />;

    case TransactionType.shieldSubscriptionApprove:
      return <ShieldSubscriptionApproveInfo />;

    case TransactionType.tokenMethodApprove:
    case TransactionType.tokenMethodIncreaseAllowance:
      return <ApproveInfo />;

    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.tokenMethodTransferFrom:
      return <NFTTokenTransferInfo />;

    case TransactionType.tokenMethodSetApprovalForAll:
      return <SetApprovalForAllInfo />;

    case TransactionType.tokenMethodTransfer:
      return <TokenTransferInfo />;

    default:
      return null;
  }
};

export default TransactionInfo;
