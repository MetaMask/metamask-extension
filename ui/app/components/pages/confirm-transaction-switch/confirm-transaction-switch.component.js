import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import R from 'ramda'
import Loading from '../../loading-screen'
import {
  CONFIRM_DEPLOY_CONTRACT_ROUTE,
  CONFIRM_SEND_ETHER_ROUTE,
  CONFIRM_SEND_TOKEN_ROUTE,
  CONFIRM_APPROVE_ROUTE,
  CONFIRM_TOKEN_METHOD_ROUTE,
  SIGNATURE_REQUEST_ROUTE,
} from '../../../routes'
import { isConfirmDeployContract, getTokenData } from './confirm-transaction-switch.util'
import { TOKEN_METHOD_TRANSFER, TOKEN_METHOD_APPROVE } from './confirm-transaction-switch.constants'

export default class ConfirmTransactionSwitch extends Component {
  static propTypes = {
    unconfirmedTransactions: PropTypes.array,
    match: PropTypes.object,
  }

  getTransaction () {
    const { unconfirmedTransactions, match } = this.props
    const { params: { id: paramsTransactionId } = {} } = match

    return paramsTransactionId
      ? R.find(({ id }) => id + '' === paramsTransactionId)(unconfirmedTransactions)
      : unconfirmedTransactions[0]
  }

  redirectToTransaction (txData) {
    const { id, txParams: { data } } = txData

    if (isConfirmDeployContract(txData)) {
      return <Redirect to={{ pathname: `${CONFIRM_DEPLOY_CONTRACT_ROUTE}/${id}` }} />
    }

    if (data) {
      const tokenData = getTokenData(data)
      const { name: tokenMethodName } = tokenData || {}

      switch (tokenMethodName) {
        case TOKEN_METHOD_TRANSFER:
          return <Redirect to={{ pathname: `${CONFIRM_SEND_TOKEN_ROUTE}/${id}` }} />
        case TOKEN_METHOD_APPROVE:
          return <Redirect to={{ pathname: `${CONFIRM_APPROVE_ROUTE}/${id}` }} />
        default:
          return <Redirect to={{ pathname: `${CONFIRM_TOKEN_METHOD_ROUTE}/${id}` }} />
      }
    }

    return <Redirect to={{ pathname: `${CONFIRM_SEND_ETHER_ROUTE}/${id}` }} />
  }

  render () {
    const txData = this.getTransaction()

    if (!txData) {
      return <Loading />
    }

    if (txData.txParams) {
      return this.redirectToTransaction(txData)
    } else if (txData.msgParams) {
      return <Redirect to={{ pathname: SIGNATURE_REQUEST_ROUTE }} />
    }

    return <Loading />
  }
}
