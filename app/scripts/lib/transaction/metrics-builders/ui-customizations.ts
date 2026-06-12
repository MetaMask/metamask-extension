/* eslint-disable @typescript-eslint/naming-convention */
import type { TransactionMetricsBuilder } from './types';

export const getUICustomizationsMetricsProperties: TransactionMetricsBuilder =
  ({ transactionMeta, transactionMetricsRequest }) => {
    const uiMetricsFragment =
      transactionMetricsRequest.getTransactionUIMetricsFragment(
        transactionMeta.id,
      );

    return {
      properties: {
        gas_edit_type: 'none',
        gas_edit_attempted: 'none',
        transaction_advanced_view:
          transactionMetricsRequest.getIsConfirmationAdvancedDetailsOpen(),
        ...(uiMetricsFragment?.properties ?? {}),
      },
      sensitiveProperties: {
        ...(uiMetricsFragment?.sensitiveProperties ?? {}),
      },
    };
  };
