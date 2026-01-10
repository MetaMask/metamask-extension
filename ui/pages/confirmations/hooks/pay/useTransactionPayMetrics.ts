import { useEffect, useMemo, useRef } from 'react';
import type { Hex, Json } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { BigNumber } from 'bignumber.js';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  useTransactionPayQuotes,
  useTransactionPayRequiredTokens,
  useTransactionPayTotals,
} from './useTransactionPayData';
import { useTransactionPayAvailableTokens } from './useTransactionPayAvailableTokens';
import { useConfirmContext } from '../../context/confirm';
import { getNativeTokenAddress, hasTransactionType } from '../../utils/transaction-pay';
import { updateEventFragment } from '../../../../store/actions';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';

export function useTransactionPayMetrics() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { payToken } = useTransactionPayToken();
  const requiredTokens = useTransactionPayRequiredTokens();
  const automaticPayToken = useRef<TransactionPaymentToken>();
  const quotes = useTransactionPayQuotes();
  const totals = useTransactionPayTotals();
  const tokens = useTransactionPayAvailableTokens();

  const availableTokens = useMemo(
    () => tokens.filter((t) => !t.disabled),
    [tokens],
  );

  const transactionId = transactionMeta?.id ?? '';
  const { chainId, type } = transactionMeta ?? {};
  const primaryRequiredToken = requiredTokens.find((t) => !t.skipIfBalance);
  const sendingValue = Number(primaryRequiredToken?.amountHuman ?? '0');

  if (!automaticPayToken.current && payToken) {
    automaticPayToken.current = payToken;
  }

  const properties: Record<string, Json> = {};

  if (payToken) {
    properties.mm_pay = true;
    properties.mm_pay_token_selected = payToken.symbol;
    properties.mm_pay_chain_selected = payToken.chainId;
    properties.mm_pay_transaction_step_total = (quotes?.length ?? 0) + 1;

    properties.mm_pay_transaction_step =
      properties.mm_pay_transaction_step_total;

    properties.mm_pay_token_presented =
      automaticPayToken.current?.symbol ?? null;

    properties.mm_pay_chain_presented =
      automaticPayToken.current?.chainId ?? null;

    properties.mm_pay_payment_token_list_size = availableTokens.length;
  }

  if (payToken && type === TransactionType.perpsDeposit) {
    properties.mm_pay_use_case = 'perps_deposit';
    properties.simulation_sending_assets_total_value = sendingValue;
  }

  if (
    payToken &&
    hasTransactionType(transactionMeta, [TransactionType.predictDeposit])
  ) {
    properties.mm_pay_use_case = 'predict_deposit';
    properties.simulation_sending_assets_total_value = sendingValue;
  }

  const nativeTokenAddress = getNativeTokenAddress(chainId as Hex);

  const nonGasQuote = quotes?.find(
    (q) => q.request?.targetTokenAddress !== nativeTokenAddress,
  );

  if (nonGasQuote) {
    properties.mm_pay_dust_usd = nonGasQuote.dust.usd;
  }

  const strategy = quotes?.[0]?.strategy;

  if (strategy === TransactionPayStrategy.Bridge) {
    properties.mm_pay_strategy = 'mm_swaps_bridge';
  }

  if (strategy === TransactionPayStrategy.Relay) {
    properties.mm_pay_strategy = 'relay';
  }

  if (totals) {
    properties.mm_pay_network_fee_usd = new BigNumber(
      totals.fees.sourceNetwork.estimate.usd,
    )
      .plus(totals.fees.targetNetwork.usd)
      .toString(10);

    properties.mm_pay_provider_fee_usd = totals.fees.provider.usd;
  }

  useEffect(() => {
    if (transactionId && Object.keys(properties).length > 0) {
      updateEventFragment(transactionId, { properties });
    }
  }, [transactionId, properties]);
}

