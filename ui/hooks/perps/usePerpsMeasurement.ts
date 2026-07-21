import { useContext, useEffect, useRef } from 'react';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';

type PerpsMeasurementOptions = {
  traceName:
    | TraceName.PerpsEntryToLiveMarketList
    | TraceName.PerpsMarketDetailLive;
  isReady: boolean;
};

/**
 * Measures a user-perceived Perps flow from component mount until its primary
 * data is ready. Traces use the MetaMetrics background API because Sentry is
 * owned by the background context, not the UI page.
 *
 * Fires once per component lifecycle -- subsequent `isReady` changes after
 * the first `true` are ignored.
 *
 * @param options - Trace identity and readiness.
 * @param options.traceName - Stable product trace identity.
 * @param options.isReady - Whether the product's live UI boundary is ready.
 */
export function usePerpsMeasurement({
  traceName,
  isReady,
}: PerpsMeasurementOptions): void {
  const { bufferedTrace, bufferedEndTrace } = useContext(MetaMetricsContext);
  const startTimeRef = useRef(Date.now());
  const hasReportedRef = useRef(false);

  // Effects run in declaration order, so the trace exists before an
  // immediately-ready view reaches the completion effect below.
  useEffect(() => {
    bufferedTrace({
      name: traceName,
      op: TraceOperation.PerpsOperation,
      tags: { feature: 'perps' },
      startTime: startTimeRef.current,
    });

    return () => {
      if (!hasReportedRef.current) {
        bufferedEndTrace({
          name: traceName,
          timestamp: Date.now(),
          data: { success: false, reason: 'unmounted' },
        });
      }
    };
  }, [bufferedEndTrace, bufferedTrace, traceName]);

  useEffect(() => {
    if (isReady && !hasReportedRef.current) {
      hasReportedRef.current = true;
      bufferedEndTrace({
        name: traceName,
        timestamp: Date.now(),
        data: { success: true },
      });
    }
  }, [bufferedEndTrace, isReady, traceName]);
}
