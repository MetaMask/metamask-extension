import { Transaction, TransactionType } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';
import { formatWithThreshold } from '../components/app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../ducks/locale/locale';

type Fee = Transaction['fees'][0]['asset'];
type Token = Transaction['from'][0]['asset'];

export function useMultichainTransactionDisplay({
  transaction,
  userAddress,
}: {
  transaction: Transaction;
  userAddress: string;
}) {
  const locale = useSelector(getIntlLocale);

  const transactionFromEntry = transaction.from?.find(
    (entry) => entry?.address === userAddress,
  );
  const transactionToEntry = transaction.to?.find(
    (entry) => entry?.address === userAddress,
  );

  const baseFee = transaction?.fees?.find((fee) => fee.type === 'base') ?? null;
  const priorityFee =
    transaction?.fees?.find((fee) => fee.type === 'priority') ?? null;

  let from = null;
  let to = null;

  switch (transaction.type) {
    case TransactionType.Swap:
      from = transactionFromEntry ?? null;
      to = transactionToEntry ?? null;
      break;
    case TransactionType.Send:
      from = transactionFromEntry ?? transaction.from?.[0] ?? null;
      to = transaction.to?.[0] ?? null;
      break;
    case TransactionType.Receive:
      from = transaction.from?.[0] ?? null;
      to = transactionToEntry ?? transaction.to?.[0] ?? null;
      break;
    default:
      from = transaction.from?.[0] ?? null;
      to = transaction.to?.[0] ?? null;
  }

  const asset = {
    [TransactionType.Send]: parseAssetWithThreshold(
      from?.asset ?? null,
      '0.00001',
      { locale, isNegative: true },
    ),
    [TransactionType.Receive]: parseAssetWithThreshold(
      to?.asset ?? null,
      '0.00001',
      { locale, isNegative: false },
    ),
    [TransactionType.Swap]: parseAssetWithThreshold(
      from?.asset ?? null,
      '0.00001',
      { locale, isNegative: true },
    ),
  }[transaction.type];

  return {
    ...transaction,
    from,
    to,
    asset,
    baseFee: parseAssetWithThreshold(baseFee?.asset ?? null, '0.0000001', {
      locale,
      isNegative: false,
    }),
    priorityFee: parseAssetWithThreshold(
      priorityFee?.asset ?? null,
      '0.0000001',
      { locale, isNegative: false },
    ),
  };
}

function parseAssetWithThreshold(
  asset: Token | Fee | null,
  threshold: string,
  { locale, isNegative }: { locale: string; isNegative: boolean },
) {
  if (asset?.fungible) {
    const numberOfDecimals = threshold.split('.')?.[1]?.length ?? 0;

    const amount = formatWithThreshold(
      Number(asset?.amount),
      Number(threshold),
      locale,
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: numberOfDecimals,
      },
    );

    if (isNegative && !amount.startsWith('<')) {
      return {
        ...asset,
        amount: `-${amount}`,
      };
    }

    return {
      ...asset,
      amount,
    };
  }

  return null;
}
