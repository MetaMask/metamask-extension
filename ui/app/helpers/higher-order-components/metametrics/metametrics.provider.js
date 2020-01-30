import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import {
  getCurrentNetworkId,
  getSelectedAsset,
  getAccountType,
  getNumberOfAccounts,
  getNumberOfTokens,
} from '../../../selectors/selectors'
import {
  txDataSelector,
} from '../../../selectors/confirm-transaction'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'
import {
  sendMetaMetricsEvent,
  sendCountIsTrackable,
} from '../../utils/metametrics.util'

class MetaMetricsProvider extends Component {
  static propTypes = {
    network: PropTypes.string.isRequired,
    environmentType: PropTypes.string.isRequired,
    activeCurrency: PropTypes.string.isRequired,
    accountType: PropTypes.string.isRequired,
    metaMetricsSendCount: PropTypes.number.isRequired,
    children: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
  }

  static childContextTypes = {
    metricsEvent: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.state = {
      previousPath: '',
      currentPath: window.location.href,
    }

    props.history.listen(() => {
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
      metricsEvent: (config = {}, overrides = {}) => {
        const { eventOpts = {} } = config
        const { name = '' } = eventOpts
        const { pathname: overRidePathName = '' } = overrides
        const isSendFlow = Boolean(name.match(/^send|^confirm/) || overRidePathName.match(/send|confirm/))

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

const mapStateToProps = state => {
  const txData = txDataSelector(state) || {}

  return {
    network: getCurrentNetworkId(state),
    environmentType: getEnvironmentType(),
    activeCurrency: getSelectedAsset(state),
    accountType: getAccountType(state),
    confirmTransactionOrigin: txData.origin,
    metaMetricsId: state.metamask.metaMetricsId,
    participateInMetaMetrics: state.metamask.participateInMetaMetrics,
    metaMetricsSendCount: state.metamask.metaMetricsSendCount,
    numberOfTokens: getNumberOfTokens(state),
    numberOfAccounts: getNumberOfAccounts(state),
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps)
)(MetaMetricsProvider)

