import { BatchTransactionParams } from '@metamask/transaction-controller';
import { useFourByte } from './useFourByte';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';

export function useNestedTransactionLabels({
  nestedTransactions,
  useIndex,
}: {
  nestedTransactions: BatchTransactionParams[];
  useIndex?: number;
}) {
  const t = useI18nContext();

  return nestedTransactions.map((nestedTransaction, index) => {
    const { data, to } = nestedTransaction;
    const methodData = useFourByte({ data, to });
    const functionName = methodData?.name;

    return (
      functionName ??
      t('confirmNestedTransactionTitle', [String((useIndex ?? index) + 1)])
    );
  });
}
