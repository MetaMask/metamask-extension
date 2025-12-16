/**
 * This file is intended to be renamed to metametrics.js once the conversion is complete.
 * MetaMetrics is our own brand, and should remain aptly named regardless of the underlying
 * metrics system. This file implements Segment analytics tracking.
 */
import React, {
  Component,
  createContext,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import PropTypes from 'prop-types';
// NOTE: Mixed v5/v5-compat imports during router migration
// - useLocation from v5: Works with the v5 HashRouter to detect navigation changes
// - matchPath from v5-compat: Provides v6 API (reversed args, pattern.path structure)
// When v6 migration is complete, change both imports to: import { useLocation, matchPath } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { matchPath } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import { omit } from 'lodash';
import { captureException, captureMessage } from '../../shared/lib/sentry';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../app/scripts/lib/util';
import {
  PATH_NAME_MAP,
  getPaths,
  DEFAULT_ROUTE,
} from '../helpers/constants/routes';
import { MetaMetricsContextProp } from '../../shared/constants/metametrics';
import { useSegmentContext } from '../hooks/useSegmentContext';
import { getParticipateInMetaMetrics } from '../selectors';
import {
  generateActionId,
  submitRequestToBackground,
} from '../store/background-connection';

import { trackMetaMetricsEvent, trackMetaMetricsPage } from '../store/actions';

// type imports
/**
 * @typedef {import('../../shared/constants/metametrics').UnsanitizedMetaMetricsEventPayload} MetaMetricsEventPayload
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsPageObject} MetaMetricsPageObject
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsReferrerObject} MetaMetricsReferrerObject
 * @typedef {import('../../shared/lib/trace').TraceRequest} TraceRequest
 * @typedef {import('../../shared/lib/trace').EndTraceRequest} EndTraceRequest
 * @typedef {import('../../shared/lib/trace').TraceCallback} TraceCallback
 */

// types
/**
 * @typedef {Omit<MetaMetricsEventPayload, 'environmentType' | 'page' | 'referrer'>} UIMetricsEventPayload
 */
/**
 * @typedef {(
 *  payload: UIMetricsEventPayload,
 *  options?: MetaMetricsEventOptions
 * ) => Promise<void>} UITrackEventMethod
 */

/**
 * @typedef {<T>(request: TraceRequest, fn?: TraceCallback<T>) => Promise<T | undefined>} UITraceMethod
 */

/**
 * @typedef {(request: EndTraceRequest) => void} UIEndTraceMethod
 */

/**
 * @typedef {UITrackEventMethod & {
 *   bufferedTrace?: UITraceMethod,
 *   bufferedEndTrace?: UIEndTraceMethod,
 *   onboardingParentContext?: React.MutableRefObject<Span | null>
 * }} MetaMetricsContextValue
 */

/**
 * @type {React.Context<MetaMetricsContextValue>}
 */
export const MetaMetricsContext = createContext(() => {
  captureException(
    Error(
      `MetaMetrics context function was called from a react node that is not a descendant of a MetaMetrics context provider`,
    ),
  );
});

export function MetaMetricsProvider({ children }) {
  const location = useLocation();
  const context = useSegmentContext();
  const isMetricsEnabled = useSelector(getParticipateInMetaMetrics);

  /** @type {React.MutableRefObject<Span | null>} */
  const onboardingParentContext = useRef(null);

  // Sometimes we want to track context properties inside the event's "properties" object.
  const addContextPropsIntoEventProperties = useCallback(
    (payload, options) => {
      const fields = options?.contextPropsIntoEventProperties;
      if (!fields || fields.length === 0) {
        return;
      }
      if (!payload.properties) {
        payload.properties = {};
      }
      if (fields.includes(MetaMetricsContextProp.PageTitle)) {
        payload.properties[MetaMetricsContextProp.PageTitle] =
          context.page?.title;
      }
    },
    [context.page?.title],
  );

  /**
   * @type {UITrackEventMethod}
   */
  const trackEvent = useCallback(
    async (payload, options) => {
      addContextPropsIntoEventProperties(payload, options);

      const fullPayload = {
        ...payload,
        environmentType: getEnvironmentType(),
        ...context,
      };

      if (isMetricsEnabled) {
        // If metrics are enabled, track immediately
        trackMetaMetricsEvent(fullPayload, options);
      } else {
        // If metrics are not enabled, buffer the event
        await submitRequestToBackground('addEventBeforeMetricsOptIn', [
          { ...fullPayload, actionId: generateActionId() },
        ]);
      }
    },
    [addContextPropsIntoEventProperties, context, isMetricsEnabled],
  );

  /**
   * @type {UITraceMethod}
   */
  const bufferedTrace = useCallback((request, fn) => {
    submitRequestToBackground('bufferedTrace', [request, fn]);
  }, []);

  /**
   * @type {UIEndTraceMethod}
   */
  const bufferedEndTrace = useCallback((request) => {
    submitRequestToBackground('bufferedEndTrace', [request]);
  }, []);

  // Used to prevent double tracking page calls
  const previousMatch = useRef();

  /**
   * Anytime the location changes, track a page change with segment.
   * Previously we would manually track changes to history and keep a
   * reference to the previous url, but with page tracking we can see
   * which page the user is on and their navigation path.
   */
  useEffect(() => {
    const environmentType = getEnvironmentType();
    // v6 matchPath doesn't support array of paths, so we loop to find first match
    const paths = getPaths();
    let match = null;
    for (const path of paths) {
      // Normalize empty string paths to '/' - they're aliases for the Home route
      const normalizedPath = path === '' ? DEFAULT_ROUTE : path;
      match = matchPath(
        {
          path: normalizedPath,
          end: true,
          caseSensitive: false, // Match v5 behavior (case-insensitive by default)
        },
        location.pathname,
      );
      if (match) {
        break;
      }
    }
    // Start by checking for a missing match route. If this falls through to
    // the else if, then we know we have a matched route for tracking.
    if (!match) {
      captureMessage(`Segment page tracking found unmatched route`, {
        extra: {
          previousMatch,
          currentPath: location.pathname,
        },
      });
    } else if (
      previousMatch.current !== match.pattern.path &&
      !(
        environmentType === 'notification' &&
        match.pattern.path === '/' &&
        previousMatch.current === undefined
      )
    ) {
      // When a notification window is open by a Dapp we do not want to track
      // the initial home route load that can sometimes happen. To handle
      // this we keep track of the previousMatch, and we skip the event track
      // in the event that we are dealing with the initial load of the
      // homepage
      const { pattern, params } = match;
      const { path } = pattern;
      const name = PATH_NAME_MAP.get(path);
      trackMetaMetricsPage(
        {
          name,
          // We do not want to send addresses or accounts in any events
          // Some routes include these as params.
          params: omit(params, ['account', 'address']),
          environmentType,
          page: context.page,
          referrer: context.referrer,
        },
        {
          isOptInPath: location.pathname.startsWith('/initialize'),
        },
      );
    }
    previousMatch.current = match?.pattern?.path;
  }, [
    location.pathname,
    location.search,
    location.hash,
    context.page,
    context.referrer,
  ]);

  // For backwards compatibility, attach the new methods as properties to trackEvent
  const trackEventWithMethods = trackEvent;
  // eslint-disable-next-line react-compiler/react-compiler
  trackEventWithMethods.bufferedTrace = bufferedTrace;
  trackEventWithMethods.bufferedEndTrace = bufferedEndTrace;
  trackEventWithMethods.onboardingParentContext = onboardingParentContext;

  return (
    <MetaMetricsContext.Provider value={trackEventWithMethods}>
      {children}
    </MetaMetricsContext.Provider>
  );
}

MetaMetricsProvider.propTypes = { children: PropTypes.node };

export class LegacyMetaMetricsProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  static defaultProps = {
    children: undefined,
  };

  static contextType = MetaMetricsContext;

  static childContextTypes = {
    // This has to be different than the type name for the old metametrics file
    // using the same name would result in whichever was lower in the tree to be
    // used.
    trackEvent: PropTypes.func,
    bufferedTrace: PropTypes.func,
    bufferedEndTrace: PropTypes.func,
  };

  getChildContext() {
    const trackEventWithMethods = this.context;
    return {
      trackEvent: trackEventWithMethods,
      bufferedTrace: trackEventWithMethods?.bufferedTrace,
      bufferedEndTrace: trackEventWithMethods?.bufferedEndTrace,
    };
  }

  render() {
    return this.props.children;
  }
}

/**
 * HOC for class components to access MetaMetricsContext
 *
 * @param {React.ComponentType} WrappedComponent - Component to wrap
 * @returns {React.ComponentType} Wrapped component with MetaMetrics context
 */
export function withMetaMetrics(WrappedComponent) {
  const WithMetaMetrics = (props) => {
    const metaMetricsContext = useContext(MetaMetricsContext);

    return (
      <WrappedComponent
        {...props}
        trackEvent={metaMetricsContext}
        bufferedTrace={metaMetricsContext?.bufferedTrace}
        bufferedEndTrace={metaMetricsContext?.bufferedEndTrace}
        onboardingParentContext={metaMetricsContext?.onboardingParentContext}
      />
    );
  };

  WithMetaMetrics.displayName = `withMetaMetrics(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithMetaMetrics;
}
