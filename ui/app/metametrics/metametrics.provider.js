import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import {
  getCurrentNetworkId,
  getSelectedAsset,
  getAccountType,
} from '../selectors'
import {
  txDataSelector,
} from '../selectors/confirm-transaction'
import { getEnvironmentType } from '../../../app/scripts/lib/util'
import {
  sendMetaMetricsEvent,
  sendCountIsTrackable,
} from './metametrics.util'

class MetaMetricsProvider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      previousPath: '',
      currentPath: window.location.href,
    }

    props.history.listen(locationObj => {
      this.setState({
        previousPath: this.state.currentPath,
        currentPath: window.location.href,
      })
    })
  }

  getChildContext () {
    const props = this.props
    const { pathname } = location
    const { previousPath, currentPath } = this.state

    return {
      metricsEvent: (config, overrides = {}) => {
        const isSendFlow = Boolean(config.eventOpts && config.eventOpts.name && config.eventOpts.name.match(/^send|^confirm/) || overrides.pathname && overrides.pathname.match(/send|confirm/))

        // if (userPermission) {
        if (props.participateInMetaMetrics || config.isOptIn) {
          return sendMetaMetricsEvent({
            ...props,
            ...config,
            previousPath,
            currentPath,
            pathname,
            excludeMetaMetricsId: isSendFlow && !sendCountIsTrackable(props.metaMetricsSendCount + 1),
            ...overrides,
          })
        }
      },
    }
  }

  render () {
    return this.props.children
  }
}

MetaMetricsProvider.propTypes = {
  network: PropTypes.string,
  environmentType: PropTypes.string,
  activeCurrency: PropTypes.string,
  accountType: PropTypes.string,
  metaMetricsSendCount: PropTypes.number,
  children: PropTypes.object,
  history: PropTypes.object,
}

MetaMetricsProvider.childContextTypes = {
  metricsEvent: PropTypes.func,
}

const mapStateToProps = state => {
  return {
    network: getCurrentNetworkId(state),
    environmentType: getEnvironmentType(),
    activeCurrency: getSelectedAsset(state),
    accountType: getAccountType(state),
    confirmTransactionOrigin: txDataSelector(state).origin,
    metaMetricsId: state.metamask.metaMetricsId,
    participateInMetaMetrics: state.metamask.participateInMetaMetrics,
    metaMetricsSendCount: state.metamask.metaMetricsSendCount,
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(MetaMetricsProvider)

