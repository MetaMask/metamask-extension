import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { debounce } from 'lodash'
import SendRowWrapper from '../send-row-wrapper'
import UserPreferencedCurrencyInput from '../../../../components/app/user-preferenced-currency-input'
import UserPreferencedTokenInput from '../../../../components/app/user-preferenced-token-input'
import AmountMaxButton from './amount-max-button'

export default class SendAmountRow extends Component {
  static propTypes = {
    amount: PropTypes.string,
    balance: PropTypes.string,
    conversionRate: PropTypes.number,
    gasTotal: PropTypes.string,
    inError: PropTypes.bool,
    primaryCurrency: PropTypes.string,
    sendToken: PropTypes.object,
    setMaxModeTo: PropTypes.func,
    tokenBalance: PropTypes.string,
    updateGasFeeError: PropTypes.func,
    updateSendAmount: PropTypes.func,
    updateSendAmountError: PropTypes.func,
    updateGas: PropTypes.func,
    maxModeOn: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  componentDidUpdate(prevProps) {
    const { maxModeOn: prevMaxModeOn, gasTotal: prevGasTotal } = prevProps
    const { maxModeOn, amount, gasTotal, sendToken } = this.props

    if (maxModeOn && sendToken && !prevMaxModeOn) {
      this.updateGas(amount)
    }

    if (prevGasTotal !== gasTotal) {
      this.validateAmount(amount)
    }
  }

  updateGas = debounce(this.updateGas.bind(this), 500)

  validateAmount(amount) {
    const {
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
      sendToken,
      tokenBalance,
      updateGasFeeError,
      updateSendAmountError,
    } = this.props

    updateSendAmountError({
      amount,
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
      sendToken,
      tokenBalance,
    })

    if (sendToken) {
      updateGasFeeError({
        balance,
        conversionRate,
        gasTotal,
        primaryCurrency,
        sendToken,
        tokenBalance,
      })
    }
  }

  updateAmount(amount) {
    const { updateSendAmount, setMaxModeTo } = this.props

    setMaxModeTo(false)
    updateSendAmount(amount)
  }

  updateGas(amount) {
    const { sendToken, updateGas } = this.props

    if (sendToken) {
      updateGas({ amount })
    }
  }

  handleChange = (newAmount) => {
    this.validateAmount(newAmount)
    this.updateGas(newAmount)
    this.updateAmount(newAmount)
  }

  renderInput() {
    const { amount, inError, sendToken } = this.props

    return sendToken ? (
      <UserPreferencedTokenInput
        error={inError}
        onChange={this.handleChange}
        token={sendToken}
        value={amount}
      />
    ) : (
      <UserPreferencedCurrencyInput
        error={inError}
        onChange={this.handleChange}
        value={amount}
      />
    )
  }

  render() {
    const { gasTotal, inError } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('amount')}:`}
        showError={inError}
        errorType="amount"
      >
        {gasTotal && <AmountMaxButton inError={inError} />}
        {this.renderInput()}
      </SendRowWrapper>
    )
  }
}
