import {
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { addHexPrefix } from '../../../shared/lib/add-hex-prefix';
import { TransactionGroupStatus } from '../../../shared/constants/transaction';
import { readAddressAsContract } from '../../../shared/lib/contract-utils';

type TranslateFunction = (key: string, substitutions?: unknown[]) => string;

/**
 * Returns four-byte method signature from data
 *
 * @param data - The hex data (@code txParams.data) of a transaction
 * @returns The four-byte method signature
 */
export function getFourBytePrefix(data = ''): string {
  const prefixedData = addHexPrefix(data);
  const fourBytePrefix = prefixedData.slice(0, 10);
  return fourBytePrefix;
}

/**
 * Given an transaction category, returns a boolean which indicates whether the transaction is calling an erc20 token method
 *
 * @param type - The type of transaction being evaluated
 * @returns whether the transaction is calling an erc20 token method
 */
export function isTokenMethodAction(type: TransactionType): boolean {
  return [
    TransactionType.tokenMethodTransfer,
    TransactionType.tokenMethodApprove,
    TransactionType.tokenMethodSetApprovalForAll,
    TransactionType.tokenMethodTransferFrom,
    TransactionType.tokenMethodSafeTransferFrom,
    TransactionType.tokenMethodIncreaseAllowance,
  ].includes(type);
}

export function getLatestSubmittedTxWithNonce(
  transactions: TransactionMeta[] = [],
  nonce = '0x0',
): TransactionMeta | Record<string, never> {
  if (!transactions.length) {
    return {};
  }

  return transactions.reduce<TransactionMeta | Record<string, never>>(
    (acc, current) => {
      const { submittedTime, txParams: { nonce: currentNonce } = {} } = current;

      if (currentNonce === nonce) {
        if (!('submittedTime' in acc) || !acc.submittedTime) {
          return current;
        }
        return (submittedTime ?? 0) > acc.submittedTime ? current : acc;
      }
      return acc;
    },
    {},
  );
}

export async function isSmartContractAddress(
  address: string,
): Promise<boolean> {
  const { isContractAddress } = await readAddressAsContract(
    global.ethereumProvider,
    address,
  );
  return isContractAddress;
}

export function isLegacyTransaction(txParams?: {
  type?: TransactionEnvelopeType;
}): boolean {
  return txParams?.type === TransactionEnvelopeType.legacy;
}

/**
 * Returns a status key for a transaction. Requires parsing the txMeta.txReceipt on top of
 * txMeta.status because txMeta.status does not reflect on-chain errors.
 *
 * @param transaction - The txMeta object of a transaction.
 */
export function getStatusKey(transaction: TransactionMeta): string {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction;

  // There was an on-chain failure
  if (receiptStatus === '0x0') {
    return TransactionStatus.failed;
  }

  if (
    status === TransactionStatus.confirmed &&
    type === TransactionType.cancel
  ) {
    return TransactionGroupStatus.cancelled;
  }

  return transaction.status;
}

/**
 * Returns a title for the given transaction category.
 *
 * This will throw an error if the transaction category is unrecognized and no default is provided.
 *
 * @param t - The translation function
 * @param type - The transaction type constant
 * @param nativeCurrency - The native currency of the currently selected network
 * @returns The transaction category title
 */
export function getTransactionTypeTitle(
  t: TranslateFunction,
  type: TransactionType,
  nativeCurrency = 'ETH',
): string {
  switch (type) {
    case TransactionType.tokenMethodTransfer: {
      return t('transfer');
    }
    case TransactionType.tokenMethodTransferFrom: {
      return t('transferFrom');
    }
    case TransactionType.tokenMethodSafeTransferFrom: {
      return t('safeTransferFrom');
    }
    case TransactionType.tokenMethodApprove: {
      return t('approve');
    }
    case TransactionType.tokenMethodSetApprovalForAll: {
      return t('setApprovalForAll');
    }
    case TransactionType.tokenMethodIncreaseAllowance: {
      return t('approveIncreaseAllowance');
    }
    case TransactionType.simpleSend: {
      return t('sendingNativeAsset', [nativeCurrency]);
    }
    case TransactionType.contractInteraction:
    case TransactionType.batch:
    case TransactionType.revokeDelegation: {
      return t('contractInteraction');
    }
    case TransactionType.deployContract: {
      return t('contractDeployment');
    }
    case TransactionType.swap: {
      return t('swap');
    }
    case TransactionType.swapAndSend: {
      return t('swapAndSend');
    }
    case TransactionType.swapApproval: {
      return t('swapApproval');
    }
    default: {
      throw new Error(`Unrecognized transaction type: ${type}`);
    }
  }
}
