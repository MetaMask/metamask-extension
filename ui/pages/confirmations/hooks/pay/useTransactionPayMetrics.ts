import { useEffect, useMemo, useRef } from 'react';
import type { Json } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { useConfirmContext } from '../../context/confirm';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { useTransactionPayToken } from './useTransactionPayToken';
import { useTransactionPayQuotes } from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

export function useTransactionPayMetrics() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { payToken } = useTransactionPayToken();
  const automaticPayToken = useRef<TransactionPaymentToken>();
  const hasLoadedQuoteRef = useRef(false);
  const quotes = useTransactionPayQuotes();
  const tokens = useTransactionPayAvailableTokens();

  const hasQuotes = (quotes?.length ?? 0) > 0;
  if (hasQuotes && !hasLoadedQuoteRef.current) {
    hasLoadedQuoteRef.current = true;
  }

  const availableTokens = useMemo(
    () => tokens.filter((t) => !t.disabled),
    [tokens],
  );

  const transactionId = transactionMeta?.id ?? '';

  if (!automaticPayToken.current && payToken) {
    automaticPayToken.current = payToken;
  }

  const properties = useMemo(() => {
    const props: Record<string, Json> = {};

    if (payToken) {
      props.mm_pay_token_presented = automaticPayToken.current?.symbol ?? null;
      props.mm_pay_chain_presented = automaticPayToken.current?.chainId ?? null;
      props.mm_pay_payment_token_list_size = availableTokens.length;
      props.mm_pay_quote_loaded = hasLoadedQuoteRef.current;
      props.mm_pay_quote_requested = false;
      props.mm_pay_chain_highest_balance_caip = null;
    }

    return props;
  }, [availableTokens.length, payToken]);

  useEffect(() => {
    if (transactionId && Object.keys(properties).length > 0) {
      upsertTransactionUIMetricsFragment(transactionId, { properties });
    }
  }, [transactionId, properties]);
}
