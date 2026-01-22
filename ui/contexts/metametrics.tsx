/**
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
  useMemo,
  type ReactNode,
  type MutableRefObject,
  type ComponentType,
} from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { Span } from '@sentry/types';

import { omit } from 'lodash';
import { captureException, captureMessage } from '../../shared/lib/sentry';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../app/scripts/lib/util';
import {
  PATH_NAME_MAP,
  getPaths,
  DEFAULT_ROUTE,
  type AppRoutes,
} from '../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  type UnsanitizedMetaMetricsEventPayload,
  type MetaMetricsEventOptions,
  type MetaMetricsEventPayload,
} from '../../shared/constants/metametrics';
import { useSegmentContext } from '../hooks/useSegmentContext';
import { getParticipateInMetaMetrics } from '../selectors';
import {
  generateActionId,
  submitRequestToBackground,
} from '../store/background-connection';

import { trackMetaMetricsEvent, trackMetaMetricsPage } from '../store/actions';
import type {
  TraceRequest,
  EndTraceRequest,
  TraceCallback,
} from '../../shared/lib/trace';

/**
 * UI-specific event payload that omits fields added by the provider
 */
export type UIMetricsEventPayload = Omit<
  UnsanitizedMetaMetricsEventPayload,
  'environmentType' | 'page' | 'referrer'
>;

/**
 * Method signature for tracking MetaMetrics events from the UI
 */
export type UITrackEventMethod = (
  payload: UIMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => Promise<void>;

/**
 * Method signature for starting a buffered trace
 */
export type UITraceMethod = <T>(
  request: TraceRequest,
  fn?: TraceCallback<T>,
) => Promise<T | undefined>;

/**
 * Method signature for ending a buffered trace
 */
export type UIEndTraceMethod = (request: EndTraceRequest) => void;

/**
 * The value provided by MetaMetricsContext
 */
export type MetaMetricsContextValue = {
  trackEvent: UITrackEventMethod;
  bufferedTrace: UITraceMethod;
  bufferedEndTrace: UIEndTraceMethod;
  onboardingParentContext: MutableRefObject<Span | null>;
};

const defaultContextValue: MetaMetricsContextValue = {
  trackEvent: () => {
    captureException(
      Error(
        `MetaMetrics context trackEvent was called from a react node that is not a descendant of a MetaMetrics context provider`,
      ),
    );
    return Promise.resolve();
  },
  bufferedTrace: () => {
    captureException(
      Error(
        `MetaMetrics context bufferedTrace was called from a react node that is not a descendant of a MetaMetrics context provider`,
      ),
    );
    return Promise.resolve(undefined);
  },
  bufferedEndTrace: () => {
    captureException(
      Error(
        `MetaMetrics context bufferedEndTrace was called from a react node that is not a descendant of a MetaMetrics context provider`,
      ),
    );
  },
  onboardingParentContext: { current: null },
};

export const MetaMetricsContext =
  createContext<MetaMetricsContextValue>(defaultContextValue);

type MetaMetricsProviderProps = {
  children: ReactNode;
};

export function MetaMetricsProvider({ children }: MetaMetricsProviderProps) {
  const location = useLocation();
  const context = useSegmentContext();
  const isMetricsEnabled = useSelector(getParticipateInMetaMetrics);

  const onboardingParentContext = useRef<Span | null>(null);

  // Sometimes we want to track context properties inside the event's "properties" object.
  const addContextPropsIntoEventProperties = useCallback(
    (payload: UIMetricsEventPayload, options?: MetaMetricsEventOptions) => {
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

  const trackEvent: UITrackEventMethod = useCallback(
    async (payload, options) => {
      addContextPropsIntoEventProperties(payload, options);

      const fullPayload = {
        ...payload,
        environmentType: getEnvironmentType(),
        ...context,
      };

      if (isMetricsEnabled) {
        // If metrics are enabled, track immediately
        trackMetaMetricsEvent(fullPayload as MetaMetricsEventPayload, options);
      } else {
        // If metrics are not enabled, buffer the event
        await submitRequestToBackground('addEventBeforeMetricsOptIn', [
          { ...fullPayload, actionId: generateActionId() },
        ]);
      }
    },
    [addContextPropsIntoEventProperties, context, isMetricsEnabled],
  );

  const bufferedTrace: UITraceMethod = useCallback((request, fn) => {
    return submitRequestToBackground('bufferedTrace', [request, fn]);
  }, []);

  const bufferedEndTrace: UIEndTraceMethod = useCallback((request) => {
    submitRequestToBackground('bufferedEndTrace', [request]);
  }, []);

  // Used to prevent double tracking page calls
  const previousMatch = useRef<string | undefined>();

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
    let match: ReturnType<typeof matchPath> = null;
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
      const name = PATH_NAME_MAP.get(path as AppRoutes['path']);
      trackMetaMetricsPage(
        {
          name,
          // We do not want to send addresses or accounts in any events
          // Some routes include these as params.
          params: omit(params, ['account', 'address']) as Record<
            string,
            string
          >,
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

  const contextValue = useMemo(
    () => ({
      trackEvent,
      bufferedTrace,
      bufferedEndTrace,
      onboardingParentContext,
    }),
    [trackEvent, bufferedTrace, bufferedEndTrace],
  );

  return (
    <MetaMetricsContext.Provider value={contextValue}>
      {children}
    </MetaMetricsContext.Provider>
  );
}

type LegacyChildContext = {
  trackEvent: UITrackEventMethod;
  bufferedTrace: UITraceMethod;
  bufferedEndTrace: UIEndTraceMethod;
};

type LegacyMetaMetricsProviderProps = {
  children?: ReactNode;
};

/**
 * Legacy context provider for class components using the old context API
 * @deprecated Use MetaMetricsContext with useContext hook instead
 */
export class LegacyMetaMetricsProvider extends Component<LegacyMetaMetricsProviderProps> {
  static contextType = MetaMetricsContext;

  declare context: MetaMetricsContextValue;

  // eslint-disable-next-line react/static-property-placement
  static childContextTypes = {
    // This has to be different than the type name for the old metametrics file
    // using the same name would result in whichever was lower in the tree to be
    // used.
    trackEvent: (): null => null,
    bufferedTrace: (): null => null,
    bufferedEndTrace: (): null => null,
  };

  getChildContext(): LegacyChildContext {
    const { context } = this;
    return {
      trackEvent: context.trackEvent,
      bufferedTrace: context.bufferedTrace,
      bufferedEndTrace: context.bufferedEndTrace,
    };
  }

  render() {
    return this.props.children;
  }
}

/**
 * Props injected by withMetaMetrics HOC
 */
export type WithMetaMetricsProps = MetaMetricsContextValue;

/**
 * HOC for class components to access MetaMetricsContext
 *
 * @param WrappedComponent - Component to wrap
 * @returns Wrapped component with MetaMetrics context
 */
export function withMetaMetrics<Props extends WithMetaMetricsProps>(
  WrappedComponent: ComponentType<Props>,
): ComponentType<Omit<Props, keyof WithMetaMetricsProps>> {
  const WithMetaMetrics = (props: Omit<Props, keyof WithMetaMetricsProps>) => {
    const {
      trackEvent,
      bufferedTrace,
      bufferedEndTrace,
      onboardingParentContext,
    } = useContext(MetaMetricsContext);

    return (
      <WrappedComponent
        {...(props as Props)}
        trackEvent={trackEvent}
        bufferedTrace={bufferedTrace}
        bufferedEndTrace={bufferedEndTrace}
        onboardingParentContext={onboardingParentContext}
      />
    );
  };

  WithMetaMetrics.displayName = `withMetaMetrics(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithMetaMetrics;
}
