import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getSelectedInternalAccount } from '../../../../selectors';
import { createPerpsWithdrawTransaction } from './createPerpsWithdrawTransaction';

const MAX_DECIMALS = 6;

function isValidAmount(amount: string): boolean {
  return /^\d*\.?\d{0,6}$/u.test(amount);
}

export type PerpsWithdrawParams = {
  amount: string;
};

export type PerpsWithdrawResult = {
  success: boolean;
  error?: string;
};

export type UsePerpsWithdrawResult = {
  trigger: (params: PerpsWithdrawParams) => Promise<PerpsWithdrawResult>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
};

export function usePerpsWithdraw(): UsePerpsWithdrawResult {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInFlightRef = useRef(false);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const trigger = useCallback(
    async ({ amount }: PerpsWithdrawParams): Promise<PerpsWithdrawResult> => {
      if (isInFlightRef.current || isLoading) {
        return { success: false };
      }

      if (!selectedAccount?.address) {
        const nextError = 'No selected account';
        setError(nextError);
        return { success: false, error: nextError };
      }

      const normalizedAmount = amount.trim();
      if (
        !normalizedAmount ||
        !isValidAmount(normalizedAmount) ||
        normalizedAmount.split('.')[1]?.length > MAX_DECIMALS ||
        Number(normalizedAmount) <= 0
      ) {
        const nextError = 'Invalid amount';
        setError(nextError);
        return { success: false, error: nextError };
      }

      isInFlightRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const result = await createPerpsWithdrawTransaction({
          amount: normalizedAmount,
        });

        if (!result.success) {
          const nextError = result.error ?? 'Withdraw failed';
          setError(nextError);
          return { success: false, error: nextError };
        }

        return { success: true };
      } catch (withdrawError) {
        const nextError =
          withdrawError instanceof Error
            ? withdrawError.message
            : 'Withdraw failed';
        setError(nextError);
        return { success: false, error: nextError };
      } finally {
        isInFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [isLoading, selectedAccount?.address],
  );

  return {
    trigger,
    isLoading,
    error,
    resetError,
  };
}
