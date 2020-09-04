import React, { Component, createContext, useEffect, useCallback, useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { captureException } from '@sentry/browser'
import Analytics from 'analytics-node'

import {
  getCurrentNetworkId,
  getAccountType,
  getNumberOfAccounts,
  getNumberOfTokens,
} from '../selectors/selectors'
import { getSendToken } from '../selectors/send'
import {
  txDataSelector,
} from '../selectors/confirm-transaction'
import { getEnvironmentType } from '../../../app/scripts/lib/util'
import {
  sendMetaMetricsEvent,
  sendCountIsTrackable,
  segmentWriteKey,
} from '../helpers/utils/metametrics.util'

const analytics = new Analytics(segmentWriteKey)

export const MetaMetricsContext = createContext(() => {
  captureException(
    Error(`MetaMetrics context function was called from a react node that is not a descendant of a MetaMetrics context provider`),
  )
})

export const MixPanelContext = createContext(() => {
  captureException(
    Error(`MixPanel context function was called from a react node that is not a descendant of a MetaMetrics context provider`),
  )
})

export function MixPanelProvider ({ children }) {
  const metaMetricsId = useSelector((state) => state.metamask.metaMetricsId)

  const mixPanelEvent = (eventName, properties) => {
    if (metaMetricsId) {
      analytics.track({
        event: eventName,
        properties,
        userId: metaMetricsId,
      })
    }
  }

  return (
    <MixPanelContext.Provider value={mixPanelEvent}>
      {children}
    </MixPanelContext.Provider>
  )
}

MixPanelProvider.propTypes = { children: PropTypes.node }

export class LegacyMixPanelProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
  }

  static defaultProps = {
    children: undefined,
  }

  static contextType = MixPanelContext

  static childContextTypes = {
    mixPanelEvent: PropTypes.func,
  }

  getChildContext () {
    return {
      mixPanelEvent: this.context,
    }
  }

  render () {
    return this.props.children
  }
}

export function MetaMetricsProvider ({ children }) {
  const txData = useSelector(txDataSelector) || {}
  const network = useSelector(getCurrentNetworkId)
  const environmentType = getEnvironmentType()
  const activeCurrency = useSelector(getSendToken)?.symbol
  const accountType = useSelector(getAccountType)
  const confirmTransactionOrigin = txData.origin
  const metaMetricsId = useSelector((state) => state.metamask.metaMetricsId)
  const participateInMetaMetrics = useSelector((state) => state.metamask.participateInMetaMetrics)
  const metaMetricsSendCount = useSelector((state) => state.metamask.metaMetricsSendCount)
  const numberOfTokens = useSelector(getNumberOfTokens)
  const numberOfAccounts = useSelector(getNumberOfAccounts)
  const history = useHistory()
  const [state, setState] = useState(() => ({
    currentPath: (new URL(window.location.href)).pathname,
    previousPath: '',
  }))

  const { previousPath, currentPath } = state

  useEffect(() => {
    const unlisten = history.listen(() => setState((prevState) => ({
      currentPath: (new URL(window.location.href)).pathname,
      previousPath: prevState.currentPath,
    })))
    // remove this listener if the component is no longer mounted
    return unlisten
  }, [history])

  const metricsEvent = useCallback((config = {}, overrides = {}) => {
    const { eventOpts = {} } = config
    const { name = '' } = eventOpts
    const { currentPath: overrideCurrentPath = '' } = overrides
    const isSendFlow = Boolean(name.match(/^send|^confirm/u) || overrideCurrentPath.match(/send|confirm/u))

    if (participateInMetaMetrics || config.isOptIn) {
      return sendMetaMetricsEvent({
        network,
        environmentType,
        activeCurrency,
        accountType,
        confirmTransactionOrigin,
        metaMetricsId,
        numberOfTokens,
        numberOfAccounts,
        version: global.platform.getVersion(),
        ...config,
        previousPath,
        currentPath,
        excludeMetaMetricsId: isSendFlow && !sendCountIsTrackable(metaMetricsSendCount + 1),
        ...overrides,
      })
    }

    return undefined
  }, [
    network,
    environmentType,
    activeCurrency,
    accountType,
    confirmTransactionOrigin,
    participateInMetaMetrics,
    previousPath,
    metaMetricsId,
    numberOfTokens,
    numberOfAccounts,
    currentPath,
    metaMetricsSendCount,
  ])

  return (
    <MetaMetricsContext.Provider value={metricsEvent}>
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
    metricsEvent: PropTypes.func,
  }

  getChildContext () {
    return {
      metricsEvent: this.context,
    }
  }

  render () {
    return this.props.children
  }
}
