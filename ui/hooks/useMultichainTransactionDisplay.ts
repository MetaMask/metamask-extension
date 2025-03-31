import {
  Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType,
  CaipChainId,
} from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { formatWithThreshold } from '../components/app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../ducks/locale/locale';
import { TransactionGroupStatus } from '../../shared/constants/transaction';
import { MULTICHAIN_PROVIDER_CONFIGS } from '../../shared/constants/multichain/networks';

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

export function useMultichainTransactionDisplay(transaction: Transaction) {
  const locale = useSelector(getIntlLocale);

  const baseFeeAssets = transaction.fees.filter((fee) => fee.type === 'base');
  const priorityFeeAssets = transaction.fees.filter(
    (fee) => fee.type === 'priority',
  );

  const assetInputs = aggregateAmount(
    transaction.chain,
    transaction.from as Movement[],
    transaction.type === TransactionType.Send,
    locale,
  );
  const assetOutputs = aggregateAmount(
    transaction.chain,
    transaction.to as Movement[],
    transaction.type === TransactionType.Send,
    locale,
  );
  const baseFee = aggregateAmount(
    transaction.chain,
    baseFeeAssets as Movement[],
    false,
    locale,
  );
  const priorityFee = aggregateAmount(
    transaction.chain,
    priorityFeeAssets as Movement[],
    false,
    locale,
  );

  return {
    assetInputs,
    assetOutputs,
    baseFee,
    priorityFee,
  };
}

function aggregateAmount(
  chainId: CaipChainId,
  movement: Movement[],
  isNegative: boolean,
  locale: string,
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
  return Object.entries(amountByAsset).map(([_, movement]) =>
    parseAsset(chainId, movement, locale, isNegative),
  );
}

function parseAsset(
  chainId: CaipChainId,
  movement: Movement,
  locale: string,
  isNegative: boolean,
) {
  const displayAmount = formatWithThreshold(
    Number(movement.asset.amount),
    0.00000001,
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: MULTICHAIN_PROVIDER_CONFIGS[chainId].decimals || 8,
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
