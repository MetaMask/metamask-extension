/**
 * This file is intended to be renamed to metametrics.js once the conversion is complete.
 * MetaMetrics is our own brand, and should remain aptly named regardless of the underlying
 * metrics system. This file implements Segment analytics tracking.
 */
import React, {
  useRef,
  Component,
  createContext,
  useEffect,
  useMemo,
} from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useLocation, matchPath, useRouteMatch } from 'react-router-dom'
import { captureException, captureMessage } from '@sentry/browser'

import { omit } from 'lodash'

import { getEnvironmentType } from '../../../app/scripts/lib/util'
import { PATH_NAME_MAP } from '../helpers/constants/routes'
import { getCurrentLocale } from '../ducks/metamask/metamask'
import {
  getCurrentChainId,
  getMetricsNetworkIdentifier,
  txDataSelector,
} from '../selectors'
import {
  getTrackMetaMetricsEvent,
  METAMETRICS_ANONYMOUS_ID,
  segment,
} from '../../../shared/modules/metametrics'

export const MetaMetricsContext = createContext(() => {
  captureException(
    Error(
      `MetaMetrics context function was called from a react node that is not a descendant of a MetaMetrics context provider`,
    ),
  )
})

const PATHS_TO_CHECK = Object.keys(PATH_NAME_MAP)

function useSegmentContext() {
  const match = useRouteMatch({
    path: PATHS_TO_CHECK,
    exact: true,
    strict: true,
  })
  const txData = useSelector(txDataSelector) || {}
  const confirmTransactionOrigin = txData.origin

  const referrer = confirmTransactionOrigin
    ? {
        url: confirmTransactionOrigin,
      }
    : undefined

  const page = match
    ? {
        path: match.path,
        title: PATH_NAME_MAP[match.path],
        url: match.path,
      }
    : undefined

  return {
    page,
    referrer,
  }
}

export function MetaMetricsProvider({ children }) {
  const metaMetricsId = useSelector((state) => state.metamask.metaMetricsId)
  const participateInMetaMetrics = useSelector(
    (state) => state.metamask.participateInMetaMetrics,
  )
  const metaMetricsSendCount = useSelector(
    (state) => state.metamask.metaMetricsSendCount,
  )
  const locale = useSelector(getCurrentLocale)
  const location = useLocation()
  const context = useSegmentContext()
  const network = useSelector(getMetricsNetworkIdentifier)
  const chainId = useSelector(getCurrentChainId)

  /**
   * track a metametrics event
   *
   * @param {import('../../../shared/modules/metametrics').MetaMetricsEventPayload} - payload for event
   * @returns undefined
   */
  const trackEvent = useMemo(() => {
    return getTrackMetaMetricsEvent(global.platform.getVersion(), () => ({
      context,
      locale: locale.replace('_', '-'),
      environmentType: getEnvironmentType(),
      chainId,
      network,
      participateInMetaMetrics,
      metaMetricsId,
      metaMetricsSendCount,
    }))
  }, [
    network,
    participateInMetaMetrics,
    locale,
    metaMetricsId,
    metaMetricsSendCount,
    chainId,
    context,
  ])

  // Used to prevent double tracking page calls
  const previousMatch = useRef()

  /**
   * Anytime the location changes, track a page change with segment.
   * Previously we would manually track changes to history and keep a
   * reference to the previous url, but with page tracking we can see
   * which page the user is on and their navigation path.
   */
  useEffect(() => {
    const environmentType = getEnvironmentType()
    if (
      (participateInMetaMetrics === null &&
        location.pathname.startsWith('/initialize')) ||
      participateInMetaMetrics
    ) {
      // Events that happen during initialization before the user opts into MetaMetrics will be anonymous
      const idTrait = metaMetricsId ? 'userId' : 'anonymousId'
      const idValue = metaMetricsId ?? METAMETRICS_ANONYMOUS_ID
      const match = matchPath(location.pathname, {
        path: PATHS_TO_CHECK,
        exact: true,
        strict: true,
      })
      // Start by checking for a missing match route. If this falls through to the else if, then we know we
      // have a matched route for tracking.
      if (!match) {
        // We have more specific pages for each type of transaction confirmation
        // The user lands on /confirm-transaction first, then is redirected based on
        // the contents of state.
        if (location.pathname !== '/confirm-transaction') {
          // Otherwise we are legitimately missing a matching route
          captureMessage(`Segment page tracking found unmatched route`, {
            previousMatch,
            currentPath: location.pathname,
          })
        }
      } else if (
        previousMatch.current !== match.path &&
        !(
          environmentType === 'notification' &&
          match.path === '/' &&
          previousMatch.current === undefined
        )
      ) {
        // When a notification window is open by a Dapp we do not want to track the initial home route load that can
        // sometimes happen. To handle this we keep track of the previousMatch, and we skip the event track in the event
        // that we are dealing with the initial load of the homepage
        const { path, params } = match
        const name = PATH_NAME_MAP[path]
        segment.page({
          [idTrait]: idValue,
          name,
          properties: {
            // We do not want to send addresses or accounts in any events
            // Some routes include these as params.
            params: omit(params, ['account', 'address']),
            network,
            environment_type: environmentType,
          },
          context,
        })
      }
      previousMatch.current = match?.path
    }
  }, [location, context, network, metaMetricsId, participateInMetaMetrics])

  return (
    <MetaMetricsContext.Provider value={trackEvent}>
      {children}
    </MetaMetricsContext.Provider>
  )
}

MetaMetricsProvider.propTypes = { children: PropTypes.node }

export class LegacyMetaMetricsProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
  }

  static defaultProps = {
    children: undefined,
  }

  static contextType = MetaMetricsContext

  static childContextTypes = {
    // This has to be different than the type name for the old metametrics file
    // using the same name would result in whichever was lower in the tree to be
    // used.
    trackEvent: PropTypes.func,
  }

  getChildContext() {
    return {
      trackEvent: this.context,
    }
  }

  render() {
    return this.props.children
  }
}
