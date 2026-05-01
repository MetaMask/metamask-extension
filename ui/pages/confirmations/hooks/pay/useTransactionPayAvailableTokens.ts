import { useMemo } from 'react';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { useTransactionPayRequiredTokens } from './useTransactionPayData';
import { useTransactionPayToken } from './useTransactionPayToken';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const { payToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        payToken,
        requiredTokens,
        tokens,
      }),
    [payToken, requiredTokens, tokens],
  );

  return availableTokens;
}
