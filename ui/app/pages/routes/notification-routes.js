import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Route, Switch, withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import actions from '../../store/actions'
import IdleTimer from 'react-idle-timer'
import { preferencesSelector } from '../../selectors/selectors'
import { getLoadMessage, isLoadingNetwork } from './routes.selectors'

// accounts
const SendTransactionScreen = require('../send/send.container')
const ConfirmTransaction = require('../confirm-transaction')

// other views
import ConfirmAddSuggestedTokenPage from '../confirm-add-suggested-token'
import ProviderApproval from '../provider-approval'
import NotificationRedirect from '../notification-redirect'

// import Settings from '../settings'
import Authenticated from '../../helpers/higher-order-components/authenticated'
import Initialized from '../../helpers/higher-order-components/initialized'
import Lock from '../lock'

const Loading = require('../../components/ui/loading-screen')
const LoadingNetwork = require('../../components/app/loading-network-screen').default
const NetworkDropdown = require('../../components/app/dropdowns/network-dropdown')

// Global Modals
const Modal = require('../../components/app/modals').Modal
// Global Alert
const Alert = require('../../components/ui/alert')

import UnlockPage from '../unlock-page'

// Routes
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  UNLOCK_ROUTE,
  SEND_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  PROVIDER_APPROVAL,
} from '../../helpers/constants/routes'

class NotificationRoutes extends Component {
  componentWillMount () {
    const { currentCurrency, setCurrentCurrencyToUSD } = this.props

    if (!currentCurrency) {
      setCurrentCurrencyToUSD()
    }

    this.props.history.listen((locationObj, action) => {
      if (action === 'PUSH') {
        const url = `&url=${encodeURIComponent('http://www.metamask.io/metametrics' + locationObj.pathname)}`
        this.context.metricsEvent({}, {
          currentPath: '',
          pathname: locationObj.pathname,
          url,
          pageOpts: {
            hideDimensions: true,
          },
        })
      }
    })
  }

  renderRoutes () {
    const { autoLogoutTimeLimit, setLastActiveTime } = this.props

    const routes = (
      <Switch>
        <Route path={LOCK_ROUTE} component={Lock} exact />
        <Initialized path={UNLOCK_ROUTE} component={UnlockPage} exact />
        <Authenticated path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`} component={ConfirmTransaction} />
        <Authenticated path={SEND_ROUTE} component={SendTransactionScreen} exact />
        <Authenticated path={CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE} component={ConfirmAddSuggestedTokenPage} exact />
        <Authenticated path={PROVIDER_APPROVAL} component={ProviderApproval} exact />
        <Authenticated path={DEFAULT_ROUTE} component={NotificationRedirect} exact />
      </Switch>
    )

    if (autoLogoutTimeLimit > 0) {
      return (
        <IdleTimer onAction={setLastActiveTime} throttle={1000}>
          {routes}
        </IdleTimer>
      )
    }

    return routes
  }

  render () {
    const {
      alertMessage,
      frequentRpcListDetail,
      isLoading,
      isLoadingNetwork,
      loadMessage,
      provider,
      setMouseUserState,
    } = this.props

    return (
      <div
        className="app"
        onClick={() => setMouseUserState(true)}
        onKeyDown={e => {
          if (e.keyCode === 9) {
            setMouseUserState(false)
          }
        }}
      >
        <Modal />
        <Alert
          visible={this.props.alertOpen}
          msg={alertMessage}
        />
        <NetworkDropdown
          provider={provider}
          frequentRpcListDetail={frequentRpcListDetail}
        />
        <div className="main-container-wrapper">
          { isLoading && <Loading loadingMessage={loadMessage} /> }
          { !isLoading && isLoadingNetwork && <LoadingNetwork /> }
          { this.renderRoutes() }
        </div>
      </div>
    )
  }
}

NotificationRoutes.propTypes = {
  alertMessage: PropTypes.string,
  alertOpen: PropTypes.bool,
  autoLogoutTimeLimit: PropTypes.number,
  currentCurrency: PropTypes.string,
  frequentRpcListDetail: PropTypes.array,
  history: PropTypes.object,
  isLoading: PropTypes.bool,
  isLoadingNetwork: PropTypes.bool,
  loadMessage: PropTypes.string,
  provider: PropTypes.object,
  setCurrentCurrencyToUSD: PropTypes.func,
  setLastActiveTime: PropTypes.func,
  setMouseUserState: PropTypes.func,
}

function mapStateToProps (state) {
  const { appState, metamask } = state
  const {
    alertOpen,
    alertMessage,
    isLoading,
  } = appState
  const { autoLogoutTimeLimit = 0 } = preferencesSelector(state)

  const {
    currentCurrency,
    frequentRpcListDetail = [],
  } = metamask

  return {
    alertMessage,
    alertOpen,
    autoLogoutTimeLimit,
    currentCurrency,
    frequentRpcListDetail,
    isLoading,
    isLoadingNetwork: isLoadingNetwork(state),
    loadMessage: getLoadMessage(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setCurrentCurrencyToUSD: () => dispatch(actions.setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) => dispatch(actions.setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(actions.setLastActiveTime()),
  }
}

NotificationRoutes.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NotificationRoutes)
