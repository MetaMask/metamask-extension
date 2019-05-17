import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Switch, Route } from 'react-router-dom'
import Loading from '../../components/ui/loading-screen'
import ConfirmTransactionSwitch from '../confirm-transaction-switch'
import ConfirmTransactionBase from '../confirm-transaction-base'
import ConfirmSendEther from '../confirm-send-ether'
import ConfirmSendToken from '../confirm-send-token'
import ConfirmDeployContract from '../confirm-deploy-contract'
import ConfirmApprove from '../confirm-approve'
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base'
import ConfTx from './conf-tx'
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
} from '../../helpers/constants/routes'

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
    fetchBasicGasAndTimeEstimates: PropTypes.func,
    transaction: PropTypes.object,
    getContractMethodData: PropTypes.func,
    transactionId: PropTypes.number,
    paramsTransactionId: PropTypes.number,
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
      transaction: { txParams: { data } = {} } = {},
      fetchBasicGasAndTimeEstimates,
      getContractMethodData,
      transactionId,
      paramsTransactionId,
    } = this.props

    if (!totalUnapprovedCount && !send.to) {
      history.replace(DEFAULT_ROUTE)
      return
    }

    fetchBasicGasAndTimeEstimates()
    getContractMethodData(data)
    this.props.setTransactionToConfirm(transactionId || paramsTransactionId)
  }

  componentDidUpdate (prevProps) {
    const {
      setTransactionToConfirm,
      transaction: { txData: { txParams: { data } = {} } = {} },
      clearConfirmTransaction,
      getContractMethodData,
      paramsTransactionId,
      transactionId,
    } = this.props

    if (paramsTransactionId && transactionId && prevProps.paramsTransactionId !== paramsTransactionId) {
      clearConfirmTransaction()
      getContractMethodData(data)
      setTransactionToConfirm(paramsTransactionId)
      return
    }
  }

  render () {
    const { transaction: { id } = {}, paramsTransactionId } = this.props
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
