import { mergeWith, uniq } from 'lodash';
import { createProjectLogger } from '@metamask/utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import type {
  TransactionEventPayload,
  TransactionMetricsRequest,
} from '../../../../../shared/types/metametrics';
import { buildTransactionMetricsContext } from '../metrics-context';
import { getAccountMetricsProperties } from './account';
import { getBaseMetricsProperties } from './base';
import { getBatchMetricsProperties } from './batch';
import { getGasMetricsProperties } from './gas';
import { getGaslessMetricsProperties } from './gasless';
import { getHashMetricsProperties } from './hash';
import { getIframeMetricsProperties } from './iframe';
import { getRPCMetricsProperties } from './rpc';
import { getSecurityMetricsProperties } from './security';
import { getSmartTransactionProperties } from './smart-transactions';
import { getSwapBridgeMetricsProperties } from './swap-bridge';
import { getTransactionDetailsMetricsProperties } from './transaction-details';
import { getUICustomizationsMetricsProperties } from './ui-customizations';
import type { TransactionMetrics, TransactionMetricsBuilder } from './types';

const log = createProjectLogger('transaction-metrics-builders');

const TERMINAL_LIFECYCLE_EVENTS: ReadonlySet<TransactionMetaMetricsEvent> =
  new Set([
    TransactionMetaMetricsEvent.finalized,
    TransactionMetaMetricsEvent.rejected,
  ]);

const EMPTY_METRICS: TransactionMetrics = Object.freeze({
  properties: {},
  sensitiveProperties: {},
});

const METRICS_BUILDERS: TransactionMetricsBuilder[] = [
  getBaseMetricsProperties,
  getGasMetricsProperties,
  getBatchMetricsProperties,
  getHashMetricsProperties,
  getIframeMetricsProperties,
  getSmartTransactionProperties,
  getSecurityMetricsProperties,
  getRPCMetricsProperties,
  getSwapBridgeMetricsProperties,
  getAccountMetricsProperties,
  getGaslessMetricsProperties,
  getTransactionDetailsMetricsProperties,
  getUICustomizationsMetricsProperties,
];

export async function getBuilderMetrics({
  eventName,
  transactionEventPayload,
  transactionMeta,
  transactionMetricsRequest,
}: {
  eventName: TransactionMetaMetricsEvent;
  transactionEventPayload: TransactionEventPayload;
  transactionMeta: TransactionMeta;
  transactionMetricsRequest: TransactionMetricsRequest;
}): Promise<TransactionMetrics> {
  const context = await buildTransactionMetricsContext({
    transactionMeta,
    transactionMetricsRequest,
  });

  const results = await Promise.all(
    METRICS_BUILDERS.map(async (builder) => {
      try {
        return await builder({
          eventName,
          transactionEventPayload,
          transactionMeta,
          transactionMetricsRequest,
          context,
        });
      } catch (error) {
        log('Metrics builder failed', error);
        return EMPTY_METRICS;
      }
    }),
  );

  const merged = results.reduce(
    (acc, current) =>
      mergeWith(acc, current, (objValue, srcValue, key) => {
        if (Array.isArray(objValue) && Array.isArray(srcValue)) {
          return key === 'ui_customizations'
            ? uniq([...objValue, ...srcValue])
            : srcValue;
        }
        return undefined;
      }),
    {
      properties: {},
      sensitiveProperties: {},
    } as TransactionMetrics,
  );

  // Release any client-side state keyed by transaction id once we hit a
  // terminal lifecycle event. Bounded by session anyway (state is
  // non-persisted), but explicit cleanup keeps memory tight for long
  // background sessions.
  if (TERMINAL_LIFECYCLE_EVENTS.has(eventName) && transactionMeta?.id) {
    try {
      transactionMetricsRequest.removeTransactionFrameContext(
        transactionMeta.id,
      );
    } catch (error) {
      log('Failed to release transaction frame context', error);
    }
  }

  return merged;
}
