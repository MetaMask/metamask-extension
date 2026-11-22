/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionContainerType } from '@metamask/transaction-controller';
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import type { TransactionMetricsBuilder } from './types';

const SUBMITTED_STATE_EVENTS = new Set([
  TransactionMetaMetricsEvent.approved,
  TransactionMetaMetricsEvent.submitted,
  TransactionMetaMetricsEvent.finalized,
]);

export const getEnforcedSimulationsMetricsProperties: TransactionMetricsBuilder =
  ({ eventName, transactionMeta }) => {
    const submittedEnabled =
      SUBMITTED_STATE_EVENTS.has(eventName) &&
      Boolean(
        transactionMeta.containerTypes?.includes(
          TransactionContainerType.EnforcedSimulations,
        ),
      );

    return {
      properties: {
        enforced_simulations_default_enabled: false,
        enforced_simulation_submitted_enabled: submittedEnabled,
        enforced_simulation_toggle_count: 0,
      },
      sensitiveProperties: {},
    };
  };
