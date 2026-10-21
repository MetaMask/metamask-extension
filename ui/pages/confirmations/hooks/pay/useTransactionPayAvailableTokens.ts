import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { selectIsSolanaPayEnabled } from '../../selectors/feature-flags';
import { useSendTokens } from '../send/useSendTokens';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';
import { useTransactionPayToken } from './useTransactionPayToken';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const blockedTokens = useTransactionPayBlockedTokens();
  const { payToken } = useTransactionPayToken();
  const isSolanaPayEnabled = useSelector(selectIsSolanaPayEnabled);

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
