import { useEffect, useMemo, useRef } from 'react';
import type { Hex, Json } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { BigNumber } from 'bignumber.js';
import { useConfirmContext } from '../../context/confirm';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  useTransactionPayPrimaryRequiredToken,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';

export function useTransactionPayMetrics() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { payToken } = useTransactionPayToken();
  const primaryRequiredToken = useTransactionPayPrimaryRequiredToken();
  const automaticPayToken = useRef<TransactionPaymentToken>();
  const hasLoadedQuoteRef = useRef(false);
  const quotes = useTransactionPayQuotes();
  const totals = useTransactionPayTotals();
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
  const { chainId } = transactionMeta ?? {};
  const sendingValue = Number(primaryRequiredToken?.amountHuman ?? '0');

  if (!automaticPayToken.current && payToken) {
    automaticPayToken.current = payToken;
  }

  const nativeTokenAddress = getNativeTokenAddress(chainId as Hex);

  const nonGasQuote = quotes?.find(
    (q) => q.request?.targetTokenAddress !== nativeTokenAddress,
  );

  const strategy = quotes?.[0]?.strategy;

  const properties = useMemo(() => {
    const props: Record<string, Json> = {};

    if (payToken) {
      props.mm_pay = true;
      props.mm_pay_token_selected = payToken.symbol;
      props.mm_pay_chain_selected = payToken.chainId;
      props.mm_pay_transaction_step_total = (quotes?.length ?? 0) + 1;
      props.mm_pay_transaction_step = props.mm_pay_transaction_step_total;
      props.mm_pay_token_presented = automaticPayToken.current?.symbol ?? null;
      props.mm_pay_chain_presented = automaticPayToken.current?.chainId ?? null;
      props.mm_pay_payment_token_list_size = availableTokens.length;
      props.mm_pay_quote_loaded = hasQuotes || hasLoadedQuoteRef.current;

      if (
        hasTransactionType(transactionMeta, [
          TransactionType.perpsDeposit,
          TransactionType.perpsWithdraw,
          TransactionType.musdConversion,
          TransactionType.musdClaim,
        ])
      ) {
        props.simulation_sending_assets_total_value = sendingValue;
      }
    }

    if (nonGasQuote) {
      props.mm_pay_dust_usd = nonGasQuote.dust.usd;
    }

    if (strategy === TransactionPayStrategy.Bridge) {
      props.mm_pay_strategy = 'mm_swaps_bridge';
    }

    if (strategy === TransactionPayStrategy.Relay) {
      props.mm_pay_strategy = 'relay';
    }

    if (totals) {
      props.mm_pay_network_fee_usd = new BigNumber(
        totals.fees.sourceNetwork.estimate.usd,
      )
        .plus(totals.fees.targetNetwork.usd)
        .toString(10);

      props.mm_pay_provider_fee_usd = totals.fees.provider.usd;
    }

    return props;
  }, [
    availableTokens.length,
    nonGasQuote,
    payToken,
    quotes?.length,
    sendingValue,
    strategy,
    totals,
    transactionMeta,
    hasQuotes,
  ]);

  useEffect(() => {
    if (transactionId && Object.keys(properties).length > 0) {
      upsertTransactionUIMetricsFragment(transactionId, { properties });
    }
  }, [transactionId, properties]);
}
