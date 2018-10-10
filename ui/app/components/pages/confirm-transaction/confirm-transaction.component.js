import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import Loading from '../../loading-screen'
import ConfirmTransactionSwitch from '../confirm-transaction-switch'
import ConfirmTransactionBase from '../confirm-transaction-base'
import ConfirmSendEther from '../confirm-send-ether'
import ConfirmSendToken from '../confirm-send-token'
import ConfirmDeployContract from '../confirm-deploy-contract'
import ConfirmApprove from '../confirm-approve'
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base'
import ConfTx from '../../../conf-tx'
import {
  DEFAULT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_DEPLOY_CONTRACT_PATH,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_SEND_TOKEN_PATH,
  CONFIRM_APPROVE_PATH,
  CONFIRM_TRANSFER_FROM_PATH,
  CONFIRM_TOKEN_METHOD_PATH,
  SIGNATURE_REQUEST_PATH,
} from '../../../routes'

export default class ConfirmTransaction extends Component {
  static propTypes = {
    history: PropTypes.object.isRequired,
    totalUnapprovedCount: PropTypes.number.isRequired,
    match: PropTypes.object,
    send: PropTypes.object,
    unconfirmedTransactions: PropTypes.array,
    setTransactionToConfirm: PropTypes.func,
    confirmTransaction: PropTypes.object,
    clearConfirmTransaction: PropTypes.func,
  }

  getParamsTransactionId () {
    const { match: { params: { id } = {} } } = this.props
    return id || null
  }

  componentDidMount () {
    const {
      totalUnapprovedCount = 0,
      send = {},
      history,
      confirmTransaction: { txData: { id: transactionId } = {} },
    } = this.props

    if (!totalUnapprovedCount && !send.to) {
      history.replace(DEFAULT_ROUTE)
      return
    }

    if (!transactionId) {
      this.setTransactionToConfirm()
    }
  }

  componentDidUpdate () {
    const {
      setTransactionToConfirm,
      confirmTransaction: { txData: { id: transactionId } = {} },
      clearConfirmTransaction,
    } = this.props
    const paramsTransactionId = this.getParamsTransactionId()

    if (paramsTransactionId && transactionId && paramsTransactionId !== transactionId + '') {
      clearConfirmTransaction()
      setTransactionToConfirm(paramsTransactionId)
      return
    }

    if (!transactionId) {
      this.setTransactionToConfirm()
    }
  }

  setTransactionToConfirm () {
    const {
      history,
      unconfirmedTransactions,
      setTransactionToConfirm,
    } = this.props
    const paramsTransactionId = this.getParamsTransactionId()

    if (paramsTransactionId) {
      // Check to make sure params ID is valid
      const tx = unconfirmedTransactions.find(({ id }) => id + '' === paramsTransactionId)

      if (!tx) {
        history.replace(DEFAULT_ROUTE)
      } else {
        setTransactionToConfirm(paramsTransactionId)
      }
    } else if (unconfirmedTransactions.length) {
      const totalUnconfirmed = unconfirmedTransactions.length
      const transaction = unconfirmedTransactions[totalUnconfirmed - 1]
      const { id: transactionId, loadingDefaults } = transaction

      if (!loadingDefaults) {
        setTransactionToConfirm(transactionId)
      }
    }
  }

  render () {
    const { confirmTransaction: { txData: { id } } = {} } = this.props
    const paramsTransactionId = this.getParamsTransactionId()

    // Show routes when state.confirmTransaction has been set and when either the ID in the params
    // isn't specified or is specified and matches the ID in state.confirmTransaction in order to
    // support URLs of /confirm-transaction or /confirm-transaction/<transactionId>
    return id && (!paramsTransactionId || paramsTransactionId === id + '')
      ? (
        <Switch>
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_DEPLOY_CONTRACT_PATH}`}
            component={ConfirmDeployContract}
          />
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_TOKEN_METHOD_PATH}`}
            component={ConfirmTransactionBase}
          />
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SEND_ETHER_PATH}`}
            component={ConfirmSendEther}
          />
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SEND_TOKEN_PATH}`}
            component={ConfirmSendToken}
          />
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_APPROVE_PATH}`}
            component={ConfirmApprove}
          />
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_TRANSFER_FROM_PATH}`}
            component={ConfirmTokenTransactionBase}
          />
          <Route
            exact
            path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${SIGNATURE_REQUEST_PATH}`}
            component={ConfTx}
          />
          <Route path="*" component={ConfirmTransactionSwitch} />
        </Switch>
      )
      : <Loading />
  }
}
