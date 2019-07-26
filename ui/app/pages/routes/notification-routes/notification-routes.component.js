import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Route, Switch } from 'react-router-dom'
import IdleTimer from 'react-idle-timer'

import ConfirmAddSuggestedTokenPage from '../../confirm-add-suggested-token'
import ProviderApproval from '../../provider-approval'
import NotificationRedirect from '../../notification-redirect'
import Authenticated from '../../../helpers/higher-order-components/authenticated'
import Initialized from '../../../helpers/higher-order-components/initialized'
import Lock from '../../lock'
import LoadingNetwork from '../../../components/app/loading-network-screen'
const SendTransactionScreen = require('../../send/send.container')
const ConfirmTransaction = require('../../confirm-transaction')
const Loading = require('../../../components/ui/loading-screen')
const NetworkDropdown = require('../../../components/app/dropdowns/network-dropdown')
const Modal = require('../../../components/app/modals').Modal
const Alert = require('../../../components/ui/alert')
import UnlockPage from '../../unlock-page'
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  UNLOCK_ROUTE,
  SEND_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  PROVIDER_APPROVAL,
} from '../../../helpers/constants/routes'

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

NotificationRoutes.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

export default NotificationRoutes
