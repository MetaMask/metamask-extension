import { BatchTransactionParams } from '@metamask/transaction-controller';
import { useFourByte } from './useFourByte';

export function useNestedTransactionLabel({
  nestedTransaction,
}: {
  nestedTransaction: BatchTransactionParams;
}) {
  const { data, to } = nestedTransaction;
  const methodData = useFourByte({ data, to });

  const functionName = methodData?.name;

  return {
    functionName,
  };
}
