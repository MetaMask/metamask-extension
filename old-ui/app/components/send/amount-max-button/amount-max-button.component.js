import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class AmountMaxButton extends Component {

  static propTypes = {
    balance: PropTypes.string,
    buttonDataLoading: PropTypes.bool,
    clearMaxAmount: PropTypes.func,
    inError: PropTypes.bool,
    gasTotal: PropTypes.string,
    maxModeOn: PropTypes.bool,
    sendToken: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setMaxModeTo: PropTypes.func,
    updateGasData: PropTypes.func,
    tokenBalance: PropTypes.string,
    address: PropTypes.string,
    amount: PropTypes.string,
    to: PropTypes.string,
    blockGasLimit: PropTypes.string,
    data: PropTypes.string,
  }

  async setMaxAmount () {
    const {
      updateGasData,
      address,
      sendToken,
      amount: value,
      to,
      data,
      blockGasLimit,
      setAmountToMax,
    } = this.props
    const params = { address, sendToken, blockGasLimit, to, value, data }
    await updateGasData(params)

    const {
      balance,
      gasTotal,
      tokenBalance,
    } = this.props

    setAmountToMax({
      balance,
      gasTotal,
      sendToken,
      tokenBalance,
    })
  }

  onMaxClick = () => {
    const { setMaxModeTo, clearMaxAmount, maxModeOn } = this.props

    if (!maxModeOn) {
      setMaxModeTo(true)
      this.setMaxAmount()
    } else {
      setMaxModeTo(false)
      clearMaxAmount()
    }
  }

  render () {
    const { maxModeOn, buttonDataLoading, inError } = this.props

    return (
      <div className="send__amount-max secondary-description" onClick={buttonDataLoading || inError ? null : this.onMaxClick}>
        <input type="checkbox" checked={maxModeOn} readOnly />
        {'send max amount'}
      </div>
    )
  }
}
