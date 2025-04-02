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
import { MultichainProviderConfig } from '../../shared/constants/multichain/networks';

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

export function useMultichainTransactionDisplay(
  transaction: Transaction,
  networkConfig: MultichainProviderConfig,
) {
  const locale = useSelector(getIntlLocale);
  const isNegative = transaction.type === TransactionType.Send;

  const assetInputs = aggregateAmount(
    transaction.from as Movement[],
    isNegative,
    locale,
    networkConfig.decimals,
  );
  const assetOutputs = aggregateAmount(
    transaction.to as Movement[],
    isNegative,
    locale,
    networkConfig.decimals,
  );
  const baseFee = aggregateAmount(
    transaction.fees.filter((fee) => fee.type === 'base') as Movement[],
    isNegative,
    locale,
  );
  const priorityFee = aggregateAmount(
    transaction.fees.filter((fee) => fee.type === 'priority') as Movement[],
    isNegative,
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
  const amountByAsset: Record<string, Movement> = {};

  for (const mv of movement) {
    if (!mv?.asset.fungible) {
      continue;
    }
    const assetId = mv.asset.type;
    if (!amountByAsset[assetId]) {
      amountByAsset[assetId] = mv;
      continue;
    }

    amountByAsset[assetId].asset.amount += Number(mv.asset.amount || 0);
  }

  // Convert to a proper display array.
  return Object.entries(amountByAsset).map(([_, mv]) =>
    parseAsset(mv, locale, isNegative, decimals),
  );
}

function parseAsset(
  movement: Movement,
  locale: string,
  isNegative: boolean,
  decimals?: number,
) {
  const displayAmount = formatWithThreshold(
    Number(movement.asset.amount),
    0.00000001,
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals || 8,
    },
  );

  let finalAmount = displayAmount;
  if (isNegative && !displayAmount.startsWith('<')) {
    finalAmount = `-${displayAmount}`;
  }

  return {
    amount: finalAmount,
    unit: movement.asset.unit,
    // It is not strictly correct to use the address here but we do not support sending multiple assets to multiple addresses
    address: movement.address,
  };
}
