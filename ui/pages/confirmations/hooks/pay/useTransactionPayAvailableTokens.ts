import { useMemo } from 'react';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        tokens,
      }),
    [tokens],
  );

  return availableTokens;
}
