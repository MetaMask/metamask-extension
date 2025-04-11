import {
  Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType,
} from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { formatWithThreshold } from '../components/app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../ducks/locale/locale';
import { TransactionGroupStatus } from '../../shared/constants/transaction';
import {
  NETWORKS_EXTRA_DATA,
  type MultichainProviderConfig,
} from '../../shared/constants/multichain/networks';

export const KEYRING_TRANSACTION_STATUS_KEY = {
  [KeyringTransactionStatus.Failed]: TransactionStatus.failed,
  [KeyringTransactionStatus.Confirmed]: TransactionStatus.confirmed,
  [KeyringTransactionStatus.Unconfirmed]: TransactionGroupStatus.pending,
  [KeyringTransactionStatus.Submitted]: TransactionStatus.submitted,
};

type Asset = {
  unit: string;
  type: `${string}:${string}/${string}:${string}`;
  amount: string;
  fungible: true;
};

type Movement = {
  asset: Asset;
  address?: string;
};

type AggregatedMovement = {
  address?: string;
  unit: string;
  amount: number;
};

export function useMultichainTransactionDisplay(
  transaction: Transaction,
  networkConfig: MultichainProviderConfig,
) {
  const locale = useSelector(getIntlLocale);
  const { chainId } = networkConfig;
  const { decimal } = NETWORKS_EXTRA_DATA[chainId];

  const assetInputs = aggregateAmount(
    transaction.from as Movement[],
    true,
    locale,
    decimal,
  );
  const assetOutputs = aggregateAmount(
    transaction.to as Movement[],
    transaction.type === TransactionType.Send,
    locale,
    decimal,
  );
  const baseFee = aggregateAmount(
    transaction.fees.filter((fee) => fee.type === 'base') as Movement[],
    true,
    locale,
  );
  const priorityFee = aggregateAmount(
    transaction.fees.filter((fee) => fee.type === 'priority') as Movement[],
    true,
    locale,
  );

  return {
    assetInputs,
    assetOutputs,
    baseFee,
    priorityFee,
    isRedeposit: assetOutputs.length === 0,
  };
}

function aggregateAmount(
  movement: Movement[],
  isNegative: boolean,
  locale: string,
  decimals?: number,
) {
  const amountByAsset: Record<string, AggregatedMovement> = {};

  for (const mv of movement) {
    if (!mv?.asset.fungible) {
      continue;
    }
    const assetId = mv.asset.type;
    if (!amountByAsset[assetId]) {
      amountByAsset[assetId] = {
        amount: parseFloat(mv.asset.amount),
        address: mv.address,
        unit: mv.asset.unit,
      };
      continue;
    }

    amountByAsset[assetId].amount += parseFloat(mv.asset.amount);
  }

  // Convert to a proper display array.
  return Object.entries(amountByAsset).map(([_, mv]) =>
    parseAsset(mv, locale, isNegative, decimals),
  );
}

function parseAsset(
  movement: AggregatedMovement,
  locale: string,
  isNegative: boolean,
  decimals?: number,
) {
  const threshold = 1 / 10 ** (decimals || 8); // Smallest unit to display given the decimals.
  const displayAmount = formatWithThreshold(
    movement.amount,
    threshold,
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals || 8,
    },
  );

  let finalAmount = displayAmount;
  if (isNegative) {
    finalAmount = `-${displayAmount}`;
  }

  return {
    ...movement,
    amount: finalAmount,
  };
}
