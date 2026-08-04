import { useMemo } from 'react';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const blockedTokens = useTransactionPayBlockedTokens();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        tokens,
        blockedTokens,
      }),
    [blockedTokens, tokens],
  );

  return availableTokens;
}
