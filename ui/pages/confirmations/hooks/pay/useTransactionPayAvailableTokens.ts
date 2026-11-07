import { useMemo } from 'react';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { useIsSolanaPaySourceEnabled } from './useIsSolanaPaySourceEnabled';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';
import { useTransactionPayToken } from './useTransactionPayToken';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const blockedTokens = useTransactionPayBlockedTokens();
  const { payToken } = useTransactionPayToken();
  const isSolanaPayEnabled = useIsSolanaPaySourceEnabled();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        tokens,
        blockedTokens,
        isSolanaPayEnabled,
        payToken,
      }),
    [blockedTokens, isSolanaPayEnabled, payToken, tokens],
  );

  return availableTokens;
}
