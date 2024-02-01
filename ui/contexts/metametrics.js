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
} from 'react';
import PropTypes from 'prop-types';
import { matchPath, useLocation } from 'react-router-dom';
import { captureException, captureMessage } from '@sentry/browser';

import { omit } from 'lodash';
import { getEnvironmentType } from '../../app/scripts/lib/util';
import { PATH_NAME_MAP } from '../helpers/constants/routes';
import { MetaMetricsContextProp } from '../../shared/constants/metametrics';
import { useSegmentContext } from '../hooks/useSegmentContext';

import { trackMetaMetricsEvent, trackMetaMetricsPage } from '../store/actions';

// type imports
/**
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventPayload} MetaMetricsEventPayload
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsEventOptions} MetaMetricsEventOptions
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsPageObject} MetaMetricsPageObject
 * @typedef {import('../../shared/constants/metametrics').MetaMetricsReferrerObject} MetaMetricsReferrerObject
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
 * @type {React.Context<UITrackEventMethod>}
 */
export const MetaMetricsContext = createContext(() => {
  captureException(
    Error(
      `MetaMetrics context function was called from a react node that is not a descendant of a MetaMetrics context provider`,
    ),
  );
});

const PATHS_TO_CHECK = Object.keys(PATH_NAME_MAP);

export function MetaMetricsProvider({ children }) {
  const location = useLocation();
  const context = useSegmentContext();

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
    (payload, options) => {
      addContextPropsIntoEventProperties(payload, options);
      trackMetaMetricsEvent(
        {
          ...payload,
          environmentType: getEnvironmentType(),
          ...context,
        },
        options,
      );
    },
    [addContextPropsIntoEventProperties, context],
  );

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
    const match = matchPath(location.pathname, {
      path: PATHS_TO_CHECK,
      exact: true,
      strict: true,
    });
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
      previousMatch.current !== match.path &&
      !(
        environmentType === 'notification' &&
        match.path === '/' &&
        previousMatch.current === undefined
      )
    ) {
      // When a notification window is open by a Dapp we do not want to track
      // the initial home route load that can sometimes happen. To handle
      // this we keep track of the previousMatch, and we skip the event track
      // in the event that we are dealing with the initial load of the
      // homepage
      const { path, params } = match;
      const name = PATH_NAME_MAP[path];
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
    previousMatch.current = match?.path;
  }, [location, context]);

  return (
    <MetaMetricsContext.Provider value={trackEvent}>
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
  };

  getChildContext() {
    return {
      trackEvent: this.context,
    };
  }

  render() {
    return this.props.children;
  }
}
