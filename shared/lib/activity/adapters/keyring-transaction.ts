import {
  type Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType as KeyringTransactionType,
} from '@metamask/keyring-api';
import type { ActivityListItem, Status, TokenAmount } from '../types';

type Movement = Transaction['from'][number];
type FungibleAsset = Extract<
  NonNullable<Movement['asset']>,
  { fungible: true }
>;

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
  return timestamp ? timestamp * 1000 : 0;
}

function getAddress(movements: Movement[]) {
  return movements[0]?.address ?? '';
}

function hasFungibleAsset(
  movement: Movement,
): movement is Movement & { asset: FungibleAsset } {
  return movement.asset?.fungible === true;
}

function getToken(
  movements: Movement[],
  direction: TokenAmount['direction'],
): TokenAmount | undefined {
  const movement = movements.find(hasFungibleAsset);

  if (!movement) {
    return undefined;
  }

  return {
    amount: movement.asset.amount,
    symbol: movement.asset.unit,
    assetId: movement.asset.type,
    direction,
  };
}
// Converts keyring API transactions into the shared activity item shape
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
    const fromToken = getToken(transaction.from, 'out');
    let token = fromToken;

    // Bitcoin transaction.from can be empty, meaning we have no asset to display
    // This workaround uses the asset from the to movement if it exists
    if (chainId.startsWith('bip122:')) {
      if (!fromToken) {
        const movement = transaction.to.find(hasFungibleAsset);
        token = { direction: 'out', assetId: movement?.asset?.type };
      }
    }

    return {
      type: 'send',
      chainId,
      status,
      timestamp,
      raw: { type: 'keyringTransaction', data: transaction },
      data: {
        hash: transaction.id,
        from,
        to,
        token,
      },
    };
  }

  if (transaction.type === KeyringTransactionType.Receive) {
    return {
      type: 'receive',
      chainId,
      status,
      timestamp,
      raw: { type: 'keyringTransaction', data: transaction },
      data: {
        hash: transaction.id,
        from,
        to,
        token: getToken(transaction.to, 'in'),
      },
    };
  }

  if (transaction.type === KeyringTransactionType.Swap) {
    return {
      type: 'swap',
      chainId,
      status,
      timestamp,
      raw: { type: 'keyringTransaction', data: transaction },
      data: {
        hash: transaction.id,
        destinationToken: getToken(transaction.to, 'in'),
        sourceToken: getToken(transaction.from, 'out'),
      },
    };
  }

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    raw: { type: 'keyringTransaction', data: transaction },
    data: {
      hash: transaction.id,
      from,
      to,
      transactionType: transaction.type,
    },
  };
}
