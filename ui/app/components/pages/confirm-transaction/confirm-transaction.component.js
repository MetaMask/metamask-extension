import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import ConfirmTransactionSwitch from '../confirm-transaction-switch'
import ConfirmTransactionBase from '../confirm-transaction-base'
import ConfirmSendEther from '../confirm-send-ether'
import ConfirmSendToken from '../confirm-send-token'
import ConfirmDeployContract from '../confirm-deploy-contract'
import ConfirmApprove from '../confirm-approve'
import ConfTx from '../../../conf-tx'
import {
  DEFAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_DEPLOY_CONTRACT_ROUTE,
  CONFIRM_SEND_ETHER_ROUTE,
  CONFIRM_SEND_TOKEN_ROUTE,
  CONFIRM_APPROVE_ROUTE,
  CONFIRM_TOKEN_METHOD_ROUTE,
  SIGNATURE_REQUEST_ROUTE,
} from '../../../routes'

export default class ConfirmTransaction extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    totalUnapprovedCount: PropTypes.number.isRequired,
    match: PropTypes.object,
    send: PropTypes.object,
  }

  componentDidMount () {
    const { totalUnapprovedCount = 0, send = {}, history } = this.props

    if (!totalUnapprovedCount && !send.to) {
      history.replace(DEFAULT_ROUTE)
    }
  }

  render () {
    return (
      <Switch>
        <Route
          exact
          path={`${CONFIRM_DEPLOY_CONTRACT_ROUTE}/:id?`}
          component={ConfirmDeployContract}
        />
        <Route
          exact
          path={`${CONFIRM_TOKEN_METHOD_ROUTE}/:id?`}
          component={ConfirmTransactionBase}
        />
        <Route exact path={`${CONFIRM_SEND_ETHER_ROUTE}/:id?`} component={ConfirmSendEther} />
        <Route exact path={`${CONFIRM_SEND_TOKEN_ROUTE}/:id?`} component={ConfirmSendToken} />
        <Route exact path={`${CONFIRM_APPROVE_ROUTE}/:id?`} component={ConfirmApprove} />
        <Route exact path={SIGNATURE_REQUEST_ROUTE} component={ConfTx} />
        <Route path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`} component={ConfirmTransactionSwitch} />
      </Switch>
    )
  }
}
