import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  selectTransactionPayIntentByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { getAvailableTokens } from '../../utils/transaction-pay';
import { useSendTokens } from '../send/useSendTokens';
import { useTransactionPayBlockedTokens } from './useTransactionPayBlockedTokens';
import { useTransactionPayToken } from './useTransactionPayToken';

export function useTransactionPayAvailableTokens() {
  const tokens = useSendTokens();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const payIntent = useSelector((state: TransactionPayState) =>
    selectTransactionPayIntentByTransactionId(
      state,
      currentConfirmation?.id ?? '',
    ),
  );
  const blockedTokens = useTransactionPayBlockedTokens();
  const { payToken } = useTransactionPayToken();

  const availableTokens = useMemo(
    () =>
      getAvailableTokens({
        tokens,
        blockedTokens,
        payToken,
        payIntent,
      }),
    [blockedTokens, payIntent, payToken, tokens],
  );

  return availableTokens;
}
