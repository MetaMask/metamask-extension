import { useMemo } from 'react';
import {
  useTransactionPaySourceAmounts,
  useTransactionPayRequiredTokens,
} from './useTransactionPayData';

export function useTransactionPayHasSourceAmount() {
  const sourceAmounts = useTransactionPaySourceAmounts();
  const requiredTokens = useTransactionPayRequiredTokens();

  return useMemo(
    () =>
      sourceAmounts?.some((a) =>
        requiredTokens.some(
          (rt) =>
            rt.address.toLowerCase() === a.targetTokenAddress.toLowerCase() &&
            !rt.skipIfBalance,
        ),
      ) ?? false,
    [sourceAmounts, requiredTokens],
  );
}
