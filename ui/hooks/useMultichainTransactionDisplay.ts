import {
  Transaction,
  TransactionStatus as KeyringTransactionStatus,
  TransactionType,
} from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { MULTICHAIN_NETWORK_DECIMAL_PLACES } from '@metamask/multichain-network-controller';
import { useSelector } from 'react-redux';
import { formatWithThreshold } from '../components/app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../ducks/locale/locale';
import { TransactionGroupStatus } from '../../shared/constants/transaction';
import type { MultichainProviderConfig } from '../../shared/constants/multichain/networks';
import { useI18nContext } from './useI18nContext';

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
  const decimalPlaces = MULTICHAIN_NETWORK_DECIMAL_PLACES[chainId];
  const t = useI18nContext();

  const from = aggregateAmount(
    transaction.from as Movement[],
    true,
    locale,
    decimalPlaces,
    networkConfig.ticker,
  );
  const to = aggregateAmount(
    transaction.to as Movement[],
    transaction.type === TransactionType.Send,
    locale,
    decimalPlaces,
    networkConfig.ticker,
  );
  const baseFee = aggregateAmount(
    transaction.fees.filter((fee) => fee.type === 'base') as Movement[],
    true,
    locale,
    undefined,
    networkConfig.ticker,
  );
  const priorityFee = aggregateAmount(
    transaction.fees.filter((fee) => fee.type === 'priority') as Movement[],
    true,
    locale,
    undefined,
    networkConfig.ticker,
  );

  const typeToTitle: Partial<Record<TransactionType, string>> = {
    // TODO: Add support for other transaction types
    [TransactionType.Send]: t('send'),
    [TransactionType.Receive]: t('receive'),
    [TransactionType.Swap]: `${t('swap')} ${from?.unit} ${t(
      'to',
    ).toLowerCase()} ${to?.unit}`,
    [TransactionType.Unknown]: t('interaction'),
  };

  return {
    ...transaction,
    title: typeToTitle[transaction.type],
    from,
    to,
    baseFee,
    priorityFee,
    isRedeposit:
      transaction.to.length === 0 && transaction.type === TransactionType.Send,
  };
}

function aggregateAmount(
  movement: Movement[],
  isNegative: boolean,
  locale: string,
  decimals?: number,
  nativeSymbol?: string,
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

  const assets = Object.values(amountByAsset);
  if (assets.length === 0) {
    return undefined;
  }

  const assetsCount = assets.length;
  // No longer logging for production.

  let selected: AggregatedMovement | undefined;
  if (assetsCount === 1) {
    selected = assets[0];
  } else if (assetsCount === 2) {
    // Prefer the non-native asset (e.g., token) over the native rent payment.
    if (nativeSymbol) {
      const nonNative = assets.find(
        (a) => a.unit.toUpperCase() !== nativeSymbol.toUpperCase(),
      );
      selected = nonNative ?? assets[1];
    } else {
      selected = assets[1];
    }
  } else {
    // Fallback for >2 assets: pick the largest by absolute amount.
    selected = assets.reduce((prev, curr) =>
      Math.abs(curr.amount) > Math.abs(prev.amount) ? curr : prev,
    );
  }

  return parseAsset(selected, locale, isNegative, decimals);
}

function parseAsset(
  movement: AggregatedMovement,
  locale: string,
  isNegative: boolean,
  decimals?: number,
) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const threshold = 1 / 10 ** (decimals || 8); // Smallest unit to display given the decimals.
  const displayAmount = formatWithThreshold(
    movement.amount,
    threshold,
    locale,
    {
      minimumFractionDigits: 0,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
