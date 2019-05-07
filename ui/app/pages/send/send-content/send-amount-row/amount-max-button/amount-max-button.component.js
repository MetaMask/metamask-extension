import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class AmountMaxButton extends Component {

  static propTypes = {
    balance: PropTypes.string,
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
    const { setMaxModeTo } = this.props
    const { metricsEvent } = this.context

    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Edit Screen',
        name: 'Clicked "Amount Max"',
      },
    })

    event.preventDefault()
    setMaxModeTo(true)
    this.setMaxAmount()
  }

  render () {
    return this.props.maxModeOn
      ? null
      : (
        <div>
          <span
            className="send-v2__amount-max"
            onClick={this.onMaxClick}
          >
            {this.context.t('max')}
          </span>
        </div>
      )
  }

}
