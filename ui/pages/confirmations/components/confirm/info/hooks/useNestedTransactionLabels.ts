import { BatchTransactionParams } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useFourByte } from './useFourByte';

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
