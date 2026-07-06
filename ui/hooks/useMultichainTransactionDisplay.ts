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
import {
  TransactionGroupCategory,
  TransactionGroupStatus,
} from '../../shared/constants/transaction';
import { getAssetsMetadata } from '../selectors/assets';
import { useI18nContext } from './useI18nContext';

export const KEYRING_TRANSACTION_STATUS_KEY = {
  [KeyringTransactionStatus.Failed]: TransactionStatus.failed,
  [KeyringTransactionStatus.Confirmed]: TransactionStatus.confirmed,
  [KeyringTransactionStatus.Unconfirmed]: TransactionGroupStatus.pending,
  [KeyringTransactionStatus.Submitted]: TransactionStatus.submitted,
};

/**
 * Custom labels for non-EVM transactions.
 * The labels are used to map the transaction type to the title in the activity list and dialog.
 * The labels are defined in the `transaction.details.typeLabel` property.
 * For details: {@link https://github.com/MetaMask/metamask-extension/pull/38040}
 */
export enum CustomTransactionTypeLabel {
  // Token requires one off approve to receive
  TrustlineApprove = 'trustline-approve',
  // Token requires revoke the approve to stop receiving
  TrustlineDisapprove = 'trustline-disapprove',
}

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

export function useMultichainTransactionDisplay(transaction: Transaction) {
  const locale = useSelector(getIntlLocale);
  const decimalPlaces = MULTICHAIN_NETWORK_DECIMAL_PLACES[transaction.chain];
  const t = useI18nContext();
  const assetsMetadata = useSelector(getAssetsMetadata);

  const from = aggregateAmount(
    transaction.from as Movement[],
    true,
    locale,
    decimalPlaces,
    assetsMetadata,
  );
  const to = aggregateAmount(
    transaction.to as Movement[],
    transaction.type === TransactionType.Send,
    locale,
    decimalPlaces,
    assetsMetadata,
  );
  const baseFee = aggregateAmount(
    (transaction.fees || []).filter((fee) => fee.type === 'base') as Movement[],
    true,
    locale,
    undefined,
    assetsMetadata,
  );
  const priorityFee = aggregateAmount(
    (transaction.fees || []).filter(
      (fee) => fee.type === 'priority',
    ) as Movement[],
    true,
    locale,
    undefined,
    assetsMetadata,
  );
  const title = getEnrichedTitle(transaction, t, from?.unit, to?.unit);
  const simplifiedTitle = getEnrichedTitle(transaction, t);

  // A flag to indicate if the transaction is a trustline type.
  const isTrustlineType = [
    String(CustomTransactionTypeLabel.TrustlineApprove),
    String(CustomTransactionTypeLabel.TrustlineDisapprove),
  ].includes(transaction.details?.typeLabel ?? '');

  return {
    ...transaction,
    groupCategory: getTransactionGroupCategory(transaction),
    title,
    simplifiedTitle,
    shouldShowAmountOrUnit: !isTrustlineType,
    from,
    to,
    baseFee,
    priorityFee,
    isRedeposit:
      transaction.to.length === 0 && transaction.type === TransactionType.Send,
  };
}

function getEnrichedTitle(
  transaction: Transaction,
  t: ReturnType<typeof useI18nContext>,
  fromSymbol?: string,
  toSymbol?: string,
) {
  const isSimplified = !fromSymbol || !toSymbol;

  // TODO: Add support for other transaction types
  const typeToTitle: Partial<Record<TransactionType, string>> = {
    // Simplify title is mainly for modal title,
    // The original title is 'Send' instead of 'Sent' in modal.
    // We don't change this title if it is by purpose.
    [TransactionType.Send]: isSimplified ? t('send') : `${t('sent')}`,
    [TransactionType.Receive]: t('received'),
    [TransactionType.Swap]: isSimplified
      ? t('swap')
      : `${t('swap')} ${fromSymbol} ${t('to').toLowerCase()} ${toSymbol}`,
    [TransactionType.StakeDeposit]: t('stakingDeposit'),
    [TransactionType.StakeWithdraw]: t('stakingWithdrawal'),
    [TransactionType.TokenApprove]: fromSymbol
      ? t('approveSpendingCap', [fromSymbol])
      : t('approve'),
    [TransactionType.Unknown]: t('interaction'),
  };

  let title = typeToTitle[transaction.type];
  const typeLabel = transaction.details?.typeLabel;
  // Enrich title by `transaction.details.typeLabel` if available.
  if (typeLabel) {
    switch (typeLabel) {
      case CustomTransactionTypeLabel.TrustlineApprove:
        title = isSimplified
          ? t('trustlineApprove')
          : `${t('trustlineApprove')} ${fromSymbol}`;
        break;
      case CustomTransactionTypeLabel.TrustlineDisapprove:
        title = isSimplified
          ? t('trustlineDisapprove')
          : `${t('trustlineDisapprove')} ${fromSymbol}`;
        break;
      default:
        break;
    }
  }
  return title;
}

function getTransactionGroupCategory(transaction: Transaction) {
  const { type } = transaction;
  let category = type as TransactionGroupCategory;

  if (type === TransactionType.Unknown) {
    category = TransactionGroupCategory.interaction;
  }

  // If there is a type label, use it to determine the group category.
  const typeLabel = transaction.details?.typeLabel;
  if (typeLabel) {
    switch (typeLabel) {
      case CustomTransactionTypeLabel.TrustlineApprove:
      case CustomTransactionTypeLabel.TrustlineDisapprove:
        category = TransactionGroupCategory.interaction;
        break;
      default:
        break;
    }
  }

  return category;
}

function aggregateAmount(
  movement: Movement[],
  isNegative: boolean,
  locale: string,
  decimals?: number,
  assetsMetadata?: ReturnType<typeof getAssetsMetadata>,
) {
  const amountByAsset: Record<string, AggregatedMovement> = {};

  for (const mv of movement) {
    // Further to keyring transaction structure,
    // `asset` can be null.
    if (!mv?.asset?.fungible) {
      continue;
    }
    const assetId = mv.asset.type;
    // The Snap sets unit:"" for SPL token movements; fall back to assetsMetadata symbol.
    const unit =
      mv.asset.unit ||
      assetsMetadata?.[assetId as keyof typeof assetsMetadata]?.symbol ||
      '';
    if (!amountByAsset[assetId]) {
      amountByAsset[assetId] = {
        amount: parseFloat(mv.asset.amount),
        address: mv.address,
        unit,
      };
      continue;
    }

    amountByAsset[assetId].amount += parseFloat(mv.asset.amount);
  }

  // We make an assumption that there is only one asset in the transaction.
  return Object.entries(amountByAsset).map(([_, mv]) =>
    parseAsset(mv, locale, isNegative, decimals),
  )[0];
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
