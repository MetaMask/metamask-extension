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
  };

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

  render () {
    const { setMaxModeTo, maxModeOn } = this.props

    return (
      <div
        className="send-v2__amount-max"
        onClick={(event) => {
          event.preventDefault()
          setMaxModeTo(true)
          this.setMaxAmount()
        }}
      >
        {!maxModeOn ? this.context.t('max') : ''}
      </div>
    )
  }

}

AmountMaxButton.contextTypes = {
  t: PropTypes.func,
}
