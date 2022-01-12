import { useContext, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import { MetaMetricsContext } from '../contexts/metametrics';
import { MetaMetricsContext as NewMetaMetricsContext } from '../contexts/metametrics.new';
import { PATH_NAME_MAP } from '../helpers/constants/routes';
import { txDataSelector } from '../selectors';
import { useEqualityCheck } from './useEqualityCheck';

// Type imports
/**
 * @typedef {import('../contexts/metametrics.new').UIMetricsEventPayload} UIMetricsEventPayload
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 */

export function useMetricEvent(config = {}, overrides = {}) {
  const metricsEvent = useContext(MetaMetricsContext);
  const trackEvent = useCallback(() => metricsEvent(config, overrides), [
    config,
    metricsEvent,
    overrides,
  ]);
  return trackEvent;
}

/**
 * track a metametrics event using segment
 * e.g metricsEvent({ event: 'Unlocked MetaMask', category: 'Navigation' })
 *
 * @param {UIMetricsEventPayload} payload - payload of the event to track
 * @param {MetaMetricsEventOptions} options - options for handling/routing event
 * @returns {() => Promise<void>} function to execute the tracking event
 */
export function useNewMetricEvent(payload, options) {
  const memoizedPayload = useEqualityCheck(payload);
  const memoizedOptions = useEqualityCheck(options);
  const metricsEvent = useContext(NewMetaMetricsContext);

  return useCallback(() => metricsEvent(memoizedPayload, memoizedOptions), [
    metricsEvent,
    memoizedPayload,
    memoizedOptions,
  ]);
}

const PATHS_TO_CHECK = Object.keys(PATH_NAME_MAP);

/**
 * Returns the current page if it matches our route map, as well as the origin
 * if there is a confirmation that was triggered by a dapp. These values are
 * not required but add valuable context to events, and should be included in
 * the context object on the event payload.
 *
 * @returns {{
 *  page?: MetaMetricsPageObject
 *  referrer?: MetaMetricsReferrerObject
 * }}
 */
export function useMetaMetricsContext() {
  const match = useRouteMatch({
    path: PATHS_TO_CHECK,
    exact: true,
    strict: true,
  });
  const txData = useSelector(txDataSelector) || {};
  const confirmTransactionOrigin = txData.origin;

  const referrer = confirmTransactionOrigin
    ? {
        url: confirmTransactionOrigin,
      }
    : undefined;

  const page = match
    ? {
        path: match.path,
        title: PATH_NAME_MAP[match.path],
        url: match.path,
      }
    : undefined;

  return {
    page,
    referrer,
  };
}
