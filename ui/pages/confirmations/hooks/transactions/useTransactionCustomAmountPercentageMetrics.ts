import { useCallback } from 'react';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';

export type PercentageAmountMetricsRequest = {
  amountFiat: string;
  isPrefill?: boolean;
  /** Undefined for a fixed prefill amount, such as a deposit-limit cap. */
  percentage?: number;
};

function getAmountInputType({
  isPrefill,
  percentage,
}: PercentageAmountMetricsRequest): string {
  if (!isPrefill) {
    return `${percentage}%`;
  }

  return percentage === undefined || percentage === 100
    ? 'prefilled_max'
    : `prefilled_${percentage}`;
}

/**
 * Records MetaMask Pay amount-input metrics for percentage and prefill
 * amounts on the current confirmation.
 *
 * @param transactionId - ID of the confirmation receiving the metrics.
 * @returns Callback to record a percentage or prefill amount.
 */
export function useTransactionCustomAmountPercentageMetrics(
  transactionId: string | undefined,
) {
  return useCallback(
    (request: PercentageAmountMetricsRequest) => {
      if (!transactionId) {
        return;
      }

      upsertTransactionUIMetricsFragment(transactionId, {
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          mm_pay_amount_input_type: getAmountInputType(request),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          mm_pay_quote_requested: true,
          // Record the USD amount prefilled at load so the controller metrics
          // builder can attach it to the executed transaction events.
          ...(request.isPrefill
            ? {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                mm_pay_prefilled_amount: Number(request.amountFiat),
              }
            : {}),
        },
      }).catch((error) => {
        console.error('Failed to record amount input metrics', error);
      });
    },
    [transactionId],
  );
}
