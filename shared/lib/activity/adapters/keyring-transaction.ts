import {
  isCrossChain,
  StatusTypes as BridgeStatusTypes,
} from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import {
  type Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType as KeyringTransactionType,
} from '@metamask/keyring-api';
import type {
  ActivityFee,
  ActivityListItem,
  Status,
  TokenAmount,
} from '../types';

type Movement = Transaction['from'][number];
type Fee = Transaction['fees'][number];
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

function getFee(fee: Fee): ActivityFee | undefined {
  const { asset } = fee;

  if (asset.fungible !== true) {
    return undefined;
  }

  return {
    type: fee.type,
    amount: asset.amount,
    symbol: asset.unit,
    assetId: asset.type,
  };
}

function getFees(transaction: Transaction) {
  return transaction.fees.flatMap((fee) => {
    const mappedFee = getFee(fee);

    return mappedFee ? [mappedFee] : [];
  });
}

function mapBridgeStatus(bridgeStatus: BridgeStatusTypes): Status {
  switch (bridgeStatus) {
    case BridgeStatusTypes.FAILED:
      return 'failed';
    case BridgeStatusTypes.COMPLETE:
      return 'success';
    case BridgeStatusTypes.PENDING:
    case BridgeStatusTypes.SUBMITTED:
    default:
      return 'pending';
  }
}

// Converts keyring API transactions into the shared activity item shape
export function mapKeyringTransaction({
  transaction,
  subjectAddress,
  bridgeHistory,
}: {
  transaction: Transaction;
  subjectAddress?: string;
  bridgeHistory?: BridgeHistoryItem;
}): ActivityListItem {
  const status = mapStatus(transaction.status);
  const timestamp = mapTimestamp(transaction.timestamp);
  const chainId = transaction.chain;

  const from =
    transaction.type === KeyringTransactionType.Send && subjectAddress
      ? subjectAddress
      : getAddress(transaction.from);

  const to =
    transaction.type === KeyringTransactionType.Receive && subjectAddress
      ? subjectAddress
      : getAddress(transaction.to);

  const fees = getFees(transaction);

  if (transaction.type === KeyringTransactionType.Send) {
    // Keyring transactions mark these as "send" but they may actually be a bridge
    // Hence, we check the local bridge history
    if (
      bridgeHistory &&
      isCrossChain(
        bridgeHistory.quote.srcChainId,
        bridgeHistory.quote.destChainId,
      )
    ) {
      const { quote } = bridgeHistory;
      const bridgeStatus = bridgeHistory.status.status;

      return {
        type: 'bridge',
        chainId,
        status: mapBridgeStatus(bridgeStatus) ?? status,
        timestamp,
        data: {
          hash: transaction.id,
          from,
          sourceToken: {
            amount: quote.srcTokenAmount,
            assetId: quote.srcAsset.assetId,
            decimals: quote.srcAsset.decimals,
            direction: 'out',
            symbol: quote.srcAsset.symbol,
          },
          destinationToken: {
            amount:
              bridgeHistory.status.destChain?.amount ?? quote.destTokenAmount,
            assetId: quote.destAsset.assetId,
            decimals: quote.destAsset.decimals,
            direction: 'in',
            symbol: quote.destAsset.symbol,
          },
          fees,
        },
      };
    }

    const fromToken = getToken(transaction.from, 'out');
    let token = fromToken;

    // Bitcoin transaction.from can be empty, resulting in no token avatar or send amount displayed.
    if (!fromToken && chainId.startsWith('bip122:')) {
      token = getToken(transaction.to, 'out');
    }

    return {
      type: 'send',
      chainId,
      status,
      timestamp,
      data: {
        hash: transaction.id,
        from,
        to,
        token,
        fees,
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
        hash: transaction.id,
        from,
        to,
        token: getToken(transaction.to, 'in'),
        fees,
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
        hash: transaction.id,
        from,
        destinationToken: getToken(transaction.to, 'in'),
        sourceToken: getToken(transaction.from, 'out'),
        fees,
      },
    };
  }

  return {
    type: 'contractInteraction',
    chainId,
    status,
    timestamp,
    data: {
      hash: transaction.id,
      from,
      to,
      fees,
      transactionType: transaction.type,
    },
  };
}
