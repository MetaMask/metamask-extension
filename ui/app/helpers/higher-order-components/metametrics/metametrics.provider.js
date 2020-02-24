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
    accountType: PropTypes.string.isRequired,
    activeCurrency: PropTypes.string.isRequired,
    children: PropTypes.object.isRequired,
    confirmTransactionOrigin: PropTypes.string,
    environmentType: PropTypes.string.isRequired,
    history: PropTypes.object.isRequired,
    metaMetricsId: PropTypes.string,
    metaMetricsSendCount: PropTypes.number.isRequired,
    network: PropTypes.string.isRequired,
    numberOfTokens: PropTypes.number,
    numberOfAccounts: PropTypes.number,
    participateInMetaMetrics: PropTypes.bool,
  }

  static childContextTypes = {
    metricsEvent: PropTypes.func,
  }

  constructor (props) {
    super(props)

    props.history.listen(() => {
      this.setState((prevState) => ({
        previousPath: prevState.currentPath,
        currentPath: window.location.href,
      }))
    })
  }

  state = {
    previousPath: '',
    currentPath: window.location.href,
  }

  getChildContext () {
    const {
      network,
      environmentType,
      activeCurrency,
      accountType,
      confirmTransactionOrigin,
      metaMetricsId,
      participateInMetaMetrics,
      metaMetricsSendCount,
      numberOfTokens,
      numberOfAccounts,
    } = this.props
    const { previousPath, currentPath } = this.state

    return {
      metricsEvent: (config = {}, overrides = {}) => {
        const { eventOpts = {} } = config
        const { name = '' } = eventOpts
        const { pathname: overRidePathName = '' } = overrides
        const isSendFlow = Boolean(name.match(/^send|^confirm/) || overRidePathName.match(/send|confirm/))

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
            ...config,
            previousPath,
            currentPath,
            excludeMetaMetricsId: isSendFlow && !sendCountIsTrackable(metaMetricsSendCount + 1),
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

const mapStateToProps = (state) => {
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

export default compose(
  withRouter,
  connect(mapStateToProps)
)(MetaMetricsProvider)

