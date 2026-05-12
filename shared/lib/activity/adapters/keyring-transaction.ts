import {
  type Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType as KeyringTransactionType,
} from '@metamask/keyring-api';
import type { ActivityListItem, Status } from '../types';

type Movement = Transaction['from'][number];
type FungibleAsset = Extract<NonNullable<Movement['asset']>, { fungible: true }>;

function mapStatus(status: Transaction['status']): Status {
  switch (status) {
    case KeyringTransactionStatus.Confirmed:
      return 'success';
    case KeyringTransactionStatus.Failed:
      return 'failed';
    case KeyringTransactionStatus.Submitted:
    case KeyringTransactionStatus.Unconfirmed:
    default:
      return 'pending';
  }
}

function mapTimestamp(timestamp: Transaction['timestamp']) {
  if (!timestamp) {
    return 0;
  }

  return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

function getAddress(movements: Movement[]) {
  return movements[0]?.address ?? '';
}

function hasFungibleAsset(
  movement: Movement,
): movement is Movement & { asset: FungibleAsset } {
  return movement.asset?.fungible === true;
}

function getTokenSymbol(movements: Movement[]) {
  return movements.find(hasFungibleAsset)?.asset.unit;
}

export function mapKeyringTransaction({
  transaction,
}: {
  transaction: Transaction;
}): ActivityListItem {
  const status = mapStatus(transaction.status);
  const timestamp = mapTimestamp(transaction.timestamp);
  const chainId = transaction.chain;
  const from = getAddress(transaction.from);
  const to = getAddress(transaction.to);

  if (transaction.type === KeyringTransactionType.Send) {
    return {
      type: 'send',
      chainId,
      status,
      timestamp,
      data: {
        from,
        to,
        tokenSymbol: getTokenSymbol(transaction.from),
      },
    };
  }

  if (transaction.type === KeyringTransactionType.Receive) {
    return {
      type: 'receive',
      chainId,
      status,
      timestamp,
      data: {
        from,
        to,
        tokenSymbol: getTokenSymbol(transaction.to),
      },
    };
  }

  if (transaction.type === KeyringTransactionType.Swap) {
    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      data: {
        destinationTokenSymbol: getTokenSymbol(transaction.to),
        sourceTokenSymbol: getTokenSymbol(transaction.from),
      },
    };
  }

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    data: {
      from,
      to,
      transactionType: transaction.type,
    },
  };
}
