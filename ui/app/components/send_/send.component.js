import React from 'react'
import PropTypes from 'prop-types'
import PersistentForm from '../../../lib/persistent-form'
import {
  getAmountErrorObject,
  doesAmountErrorRequireUpdate,
} from './send.utils'

import SendHeader from './send-header/'
import SendContent from './send-content/'
import SendFooter from './send-footer/'

export default class SendTransactionScreen extends PersistentForm {

  static propTypes = {
    amount: PropTypes.string,
    amountConversionRate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    conversionRate: PropTypes.number,
    data: PropTypes.string,
    editingTransactionId: PropTypes.string,
    from: PropTypes.object,
    gasLimit: PropTypes.string,
    gasPrice: PropTypes.string,
    gasTotal: PropTypes.string,
    history: PropTypes.object,
    network: PropTypes.string,
    primaryCurrency: PropTypes.string,
    recentBlocks: PropTypes.array,
    selectedAddress: PropTypes.string,
    selectedToken: PropTypes.object,
    tokenBalance: PropTypes.string,
    tokenContract: PropTypes.object,
    updateAndSetGasTotal: PropTypes.func,
    updateSendErrors: PropTypes.func,
    updateSendTokenBalance: PropTypes.func,
  };

  updateGas () {
    const {
      data,
      editingTransactionId,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken = {},
      updateAndSetGasTotal,
    } = this.props

    updateAndSetGasTotal({
      data,
      editingTransactionId,
      gasLimit,
      gasPrice,
      recentBlocks,
      selectedAddress,
      selectedToken,
    })
  }

  componentDidUpdate (prevProps) {
    const {
      amount,
      amountConversionRate,
      conversionRate,
      from: { address, balance },
      gasTotal,
      network,
      primaryCurrency,
      selectedToken,
      tokenBalance,
      updateSendErrors,
      updateSendTokenBalance,
      tokenContract,
    } = this.props

    const {
      from: { balance: prevBalance },
      gasTotal: prevGasTotal,
      tokenBalance: prevTokenBalance,
      network: prevNetwork,
    } = prevProps

    const uninitialized = [prevBalance, prevGasTotal].every(n => n === null)

    if (!uninitialized) {
      const amountErrorRequiresUpdate = doesAmountErrorRequireUpdate({
        balance,
        gasTotal,
        prevBalance,
        prevGasTotal,
        prevTokenBalance,
        selectedToken,
        tokenBalance,
      })

      if (amountErrorRequiresUpdate) {
        const amountErrorObject = getAmountErrorObject({
          amount,
          amountConversionRate,
          balance,
          conversionRate,
          gasTotal,
          primaryCurrency,
          selectedToken,
          tokenBalance,
        })
        updateSendErrors(amountErrorObject)
      }

      if (network !== prevNetwork && network !== 'loading') {
        updateSendTokenBalance({
          selectedToken,
          tokenContract,
          address,
        })
        this.updateGas()
      }
    }
  }

  componentWillMount () {
    const {
      from: { address },
      selectedToken,
      tokenContract,
      updateSendTokenBalance,
    } = this.props
    updateSendTokenBalance({
      selectedToken,
      tokenContract,
      address,
    })
    this.updateGas()
  }

  render () {
    const { history } = this.props

    return (
      <div className="page-container">
        <SendHeader history={history}/>
        <SendContent/>
        <SendFooter history={history}/>
      </div>
    )
  }

}

SendTransactionScreen.contextTypes = {
  t: PropTypes.func,
}
