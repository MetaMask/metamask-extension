import { TransactionType } from '@metamask/transaction-controller';
import { TransactionGroupCategory as GroupCategory } from '../../../../shared/constants/transaction';

export function mapTransactionTypeToCategory(transactionType: TransactionType) {
  switch (transactionType) {
    // Ported from useTransactionDisplayData
    case null:
    case undefined:
    case TransactionType.personalSign:
    case TransactionType.signTypedData:
    case TransactionType.ethDecrypt:
    case TransactionType.ethGetEncryptionPublicKey: {
      return GroupCategory.signatureRequest;
    }
    case TransactionType.swapApproval:
    case TransactionType.tokenMethodApprove:
    case TransactionType.tokenMethodSetApprovalForAll:
    case TransactionType.tokenMethodIncreaseAllowance:
    case TransactionType.bridgeApproval: {
      return GroupCategory.approval;
    }
    case TransactionType.contractInteraction:
    case TransactionType.batch:
    case TransactionType.revokeDelegation:
    case TransactionType.deployContract: {
      return GroupCategory.interaction;
    }
    case TransactionType.tokenMethodTransferFrom:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodSafeTransferFrom:
    case TransactionType.simpleSend: {
      return GroupCategory.send;
    }
    case TransactionType.swap: {
      return GroupCategory.swap;
    }
    case TransactionType.swapAndSend: {
      return GroupCategory.swapAndSend;
    }
    case TransactionType.bridge: {
      return GroupCategory.bridge;
    }
    case TransactionType.incoming: {
      return GroupCategory.receive;
    }
    default:
      return undefined;
  }
}
