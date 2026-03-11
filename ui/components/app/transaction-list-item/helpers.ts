import { TransactionType } from '@metamask/transaction-controller';
import { TransactionGroupCategory as GroupCategory } from '../../../../shared/constants/transaction';
import { MERKL_DISTRIBUTOR_ADDRESS } from '../musd/constants';

const MERKL_DISTRIBUTOR_ADDRESS_LOWER = MERKL_DISTRIBUTOR_ADDRESS.toLowerCase();

/**
 * After a page refresh the transaction controller re-determines the type
 * from on-chain data and reclassifies musdClaim as contractInteraction.
 * This function restores the correct type by checking the distributor address.
 * This should be a temporary work around until we fix this properly.
 *
 * @param type - The transaction type to resolve.
 * @param toAddress - The recipient address of the transaction.
 */
export function resolveTransactionType(
  type: TransactionType | undefined,
  toAddress?: string,
): TransactionType | undefined {
  if (
    type === TransactionType.contractInteraction &&
    toAddress?.toLowerCase() === MERKL_DISTRIBUTOR_ADDRESS_LOWER
  ) {
    return TransactionType.musdClaim;
  }
  return type;
}

export function mapTransactionTypeToCategory(
  transactionType: TransactionType | undefined,
) {
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
    case TransactionType.musdClaim:
    case TransactionType.musdConversion:
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
