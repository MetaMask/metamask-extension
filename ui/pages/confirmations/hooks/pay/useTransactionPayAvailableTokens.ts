import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  selectTransactionPaySourceByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { selectIsSolanaPayEnabled } from '../../selectors/feature-flags';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';
import { useTransactionPayToken } from './useTransactionPayToken';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const paySource = useSelector((state: TransactionPayState) =>
    selectTransactionPaySourceByTransactionId(
      state,
      currentConfirmation?.id ?? '',
    ),
  );
  const blockedTokens = useTransactionPayBlockedTokens();
  const isSolanaPayEnabled = useSelector(selectIsSolanaPayEnabled);
  const { payToken } = useTransactionPayToken();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        tokens,
        blockedTokens,
        payToken,
        paySource,
        isSolanaPayEnabled,
      }),
    [blockedTokens, isSolanaPayEnabled, paySource, payToken, tokens],
  );

  return availableTokens;
}
