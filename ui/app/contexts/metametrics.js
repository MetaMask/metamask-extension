import React, { Component, createContext, useEffect, useCallback, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router-dom'
import { captureException } from '@sentry/browser'

import {
  getCurrentNetworkId,
  getAccountType,
  getNumberOfAccounts,
  getNumberOfTokens,
  getCurrentChainId,
} from '../selectors/selectors'
import { getSendToken } from '../selectors/send'
import {
  txDataSelector,
} from '../selectors/confirm-transaction'
import { getEnvironmentType } from '../../../app/scripts/lib/util'
import { getTrackMetaMetricsEvent } from '../../../shared/modules/metametrics'
import { getCurrentLocale } from '../ducks/metamask/metamask'

export const MetaMetricsContext = createContext(() => {
  captureException(
    Error(`MetaMetrics context function was called from a react node that is not a descendant of a MetaMetrics context provider`),
  )
})

export function MetaMetricsProvider ({ children }) {
  const txData = useSelector(txDataSelector) || {}
  const network = useSelector(getCurrentNetworkId)
  const environmentType = getEnvironmentType()
  const chainId = useSelector(getCurrentChainId)
  const locale = useSelector(getCurrentLocale)
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

  const { currentPath } = state

  useEffect(() => {
    const unlisten = history.listen(() => setState((prevState) => ({
      currentPath: (new URL(window.location.href)).pathname,
      previousPath: prevState.currentPath,
    })))
    // remove this listener if the component is no longer mounted
    return unlisten
  }, [history])

  /**
   * track a metametrics event
   *
   * @param {import('../../../shared/modules/metametrics').MetaMetricsEventPayload} - payload for event
   * @returns undefined
   */
  const trackEvent = useMemo(() => {
    const referrer = confirmTransactionOrigin ? { url: confirmTransactionOrigin } : undefined
    const page = {
      path: currentPath,
    }
    return getTrackMetaMetricsEvent(global.platform.getVersion(), () => ({
      context: {
        referrer,
        page,
      },
      environmentType,
      locale: locale.replace('_', '-'),
      network,
      chainId,
      participateInMetaMetrics,
      metaMetricsId,
      metaMetricsSendCount,
    }))
  }, [network, chainId, locale, environmentType, participateInMetaMetrics, currentPath, confirmTransactionOrigin, metaMetricsId, metaMetricsSendCount])

  const metricsEvent = useCallback((config = {}, overrides = {}) => {
    const { eventOpts = {} } = config

    return trackEvent({
      event: eventOpts.name,
      category: eventOpts.category,
      isOptIn: config.isOptIn,
      excludeMetaMetricsId: eventOpts.excludeMetaMetricsId ?? overrides.excludeMetaMetricsId ?? false,
      metaMetricsId: config.metaMetricsId,
      matomoEvent: true,
      properties: {
        action: eventOpts.action,
        number_of_tokens: numberOfTokens,
        number_of_accounts: numberOfAccounts,
        active_currency: activeCurrency,
        account_type: accountType,
        is_new_visit: config.is_new_visit,
        // the properties coming from this key will not match our standards for
        // snake_case on properties, and they may be redundant and/or not in the
        // proper location (origin not as a referrer, for example). This is a temporary
        // solution to not lose data, and the entire event system will be reworked in
        // forthcoming PRs to deprecate the old Matomo events in favor of the new schema.
        ...config.customVariables,
      },
    })
  }, [
    accountType,
    activeCurrency,
    numberOfTokens,
    numberOfAccounts,
    trackEvent,
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
