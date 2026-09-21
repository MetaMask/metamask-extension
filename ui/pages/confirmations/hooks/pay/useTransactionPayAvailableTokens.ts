import { useMemo } from 'react';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';
import { useTransactionPayToken } from './useTransactionPayToken';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const blockedTokens = useTransactionPayBlockedTokens();
  const { payToken } = useTransactionPayToken();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        tokens,
        blockedTokens,
        payToken,
      }),
    [blockedTokens, payToken, tokens],
  );

  return availableTokens;
}
