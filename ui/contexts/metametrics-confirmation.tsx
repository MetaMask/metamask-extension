import React, { useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { Span } from '@sentry/types';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../app/scripts/lib/util';
import { getParticipateInMetaMetrics, txDataSelector } from '../selectors';
import {
  generateActionId,
  submitRequestToBackground,
} from '../store/background-connection';
import { trackMetaMetricsEvent } from '../store/actions';
import { MetaMetricsContext } from './metametrics';

export function ConfirmationMetaMetricsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const txData = useSelector(txDataSelector) || {};
  const referrer = txData.origin ? { url: txData.origin } : undefined;
  const context = { page: undefined, referrer };
  const isMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const onboardingParentContext = useRef<Span | null>(null);

  const trackEvent = useCallback(
    async (payload: any, options?: any) => {
      const fullPayload = {
        ...payload,
        environmentType: getEnvironmentType(),
        ...context,
      };
      if (isMetricsEnabled) {
        trackMetaMetricsEvent(fullPayload as any, options);
      } else {
        await submitRequestToBackground('addEventBeforeMetricsOptIn', [
          { ...fullPayload, actionId: generateActionId() },
        ]);
      }
    },
    [context, isMetricsEnabled],
  );

  const bufferedTrace = useCallback(async (request: any, fn?: any) => {
    return submitRequestToBackground('bufferedTrace', [request, fn]);
  }, []);

  const bufferedEndTrace = useCallback((request: any) => {
    submitRequestToBackground('bufferedEndTrace', [request]);
  }, []);

  const value = trackEvent as any;
  value.bufferedTrace = bufferedTrace;
  value.bufferedEndTrace = bufferedEndTrace;
  value.onboardingParentContext = onboardingParentContext;

  return (
    <MetaMetricsContext.Provider value={value}>
      {children}
    </MetaMetricsContext.Provider>
  );
}
