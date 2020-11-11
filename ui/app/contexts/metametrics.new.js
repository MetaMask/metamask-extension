/**
 * This file is intended to be renamed to metametrics.js once the conversion is complete.
 * MetaMetrics is our own brand, and should remain aptly named regardless of the underlying
 * metrics system. This file implements Segment analytics tracking.
 */
import React, { Component, createContext, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useLocation, useRouteMatch } from 'react-router-dom'
import { captureException } from '@sentry/browser'

import { getEnvironmentType } from '../../../app/scripts/lib/util'
import { PATH_NAME_MAP } from '../helpers/constants/routes'
import { txDataSelector } from '../selectors'

import { trackEvent, trackPage } from '../store/actions'

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
  const dispatch = useDispatch()
  const metaMetricsSendCount = useSelector(
    (state) => state.metamask.metaMetricsSendCount,
  )
  const location = useLocation()
  const context = useSegmentContext()

  const trackMetaMetricsEvent = useCallback(
    (payload, options) => {
      trackEvent(
        {
          ...payload,
          environmentType: getEnvironmentType(),
          ...context,
        },
        {
          ...options,
          metaMetricsSendCount,
        },
      )
    },
    [context, metaMetricsSendCount],
  )

  /**
   * Anytime the location changes, track a page change with segment.
   * Previously we would manually track changes to history and keep a
   * reference to the previous url, but with page tracking we can see
   * which page the user is on and their navigation path.
   */
  useEffect(() => {
    const environmentType = getEnvironmentType()
    dispatch(
      trackPage(location, environmentType, context.page, context.referrer),
    )
  }, [location, dispatch, context])

  return (
    <MetaMetricsContext.Provider value={trackMetaMetricsEvent}>
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
