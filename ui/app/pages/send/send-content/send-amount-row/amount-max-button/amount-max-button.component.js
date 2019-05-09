import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class AmountMaxButton extends Component {

  static propTypes = {
    balance: PropTypes.string,
    buttonDataLoading: PropTypes.bool,
    clearMaxAmount: PropTypes.func,
    gasTotal: PropTypes.string,
    maxModeOn: PropTypes.bool,
    selectedToken: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setMaxModeTo: PropTypes.func,
    tokenBalance: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  setMaxAmount () {
    const {
      balance,
      gasTotal,
      selectedToken,
      setAmountToMax,
      tokenBalance,
    } = this.props

    setAmountToMax({
      balance,
      gasTotal,
      selectedToken,
      tokenBalance,
    })
  }

  onMaxClick = (event) => {
    const { setMaxModeTo, clearMaxAmount, maxModeOn } = this.props
    const { metricsEvent } = this.context

    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Edit Screen',
        name: 'Clicked "Amount Max"',
      },
    })
    if (!maxModeOn) {
      setMaxModeTo(true)
      this.setMaxAmount()
    } else {
      setMaxModeTo(false)
      clearMaxAmount()
    }
  }

  render () {
    const { maxModeOn, buttonDataLoading } = this.props

    return (
        <div>
        <span className={classnames('send-v2__amount-max', {'send-v2__amount-max__disabled': buttonDataLoading})} onClick={this.onMaxClick}>
              <input type="checkbox" checked={maxModeOn} disabled={buttonDataLoading}/>
              {this.context.t('max')}
          </span>
        </div>
      )
  }
}
