/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import { useTransactionCustomAmountPercentageMetrics } from './useTransactionCustomAmountPercentageMetrics';

jest.mock('../../../../store/actions', () => ({
  upsertTransactionUIMetricsFragment: jest.fn(),
}));

const TRANSACTION_ID = 'tx-1';

function runHook(transactionId: string | undefined) {
  return renderHook(() =>
    useTransactionCustomAmountPercentageMetrics(transactionId),
  ).result.current;
}

describe('useTransactionCustomAmountPercentageMetrics', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('records a manual percentage selection', () => {
    const trackPercentageAmount = runHook(TRANSACTION_ID);

    trackPercentageAmount({ amountFiat: '25', percentage: 25 });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID,
      {
        properties: {
          mm_pay_amount_input_type: '25%',
          mm_pay_quote_requested: true,
        },
      },
    );
  });

  it('records a 50% prefill with the prefilled amount', () => {
    const trackPercentageAmount = runHook(TRANSACTION_ID);

    trackPercentageAmount({
      amountFiat: '51.30',
      isPrefill: true,
      percentage: 50,
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID,
      {
        properties: {
          mm_pay_amount_input_type: 'prefilled_50',
          mm_pay_quote_requested: true,
          mm_pay_prefilled_amount: 51.3,
        },
      },
    );
  });

  it('records a 100% prefill as prefilled_max', () => {
    const trackPercentageAmount = runHook(TRANSACTION_ID);

    trackPercentageAmount({
      amountFiat: '102.61',
      isPrefill: true,
      percentage: 100,
    });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID,
      expect.objectContaining({
        properties: expect.objectContaining({
          mm_pay_amount_input_type: 'prefilled_max',
          mm_pay_prefilled_amount: 102.61,
        }),
      }),
    );
  });

  it('records a fixed prefill amount as prefilled_max', () => {
    const trackPercentageAmount = runHook(TRANSACTION_ID);

    trackPercentageAmount({ amountFiat: '500', isPrefill: true });

    expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
      TRANSACTION_ID,
      expect.objectContaining({
        properties: expect.objectContaining({
          mm_pay_amount_input_type: 'prefilled_max',
          mm_pay_prefilled_amount: 500,
        }),
      }),
    );
  });

  it('does nothing without a transaction id', () => {
    const trackPercentageAmount = runHook(undefined);

    trackPercentageAmount({ amountFiat: '25', percentage: 25 });

    expect(upsertTransactionUIMetricsFragment).not.toHaveBeenCalled();
  });
});
