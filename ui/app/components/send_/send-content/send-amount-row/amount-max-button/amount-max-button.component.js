import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class AmountMaxButton extends Component {

  static propTypes = {
    tokenBalance: PropTypes.string,
    gasTotal: PropTypes.string,
    balance: PropTypes.string,
    selectedToken: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setMaxModeTo: PropTypes.func,
    maxModeOn: PropTypes.bool,
  };

  setAmountToMax = function () {
    const {
      balance,
      tokenBalance,
      selectedToken,
      gasTotal,
      setAmountToMax,
    } = this.props

    setAmountToMax({
      tokenBalance,
      selectedToken,
      gasTotal,
      setAmountToMax,
    })
  }

  render () {
    const { setMaxModeTo } = this.props

    return (
      <div
        className='send-v2__amount-max'
        onClick={(event) => {
          event.preventDefault()
          setMaxModeTo(true)
          this.setAmountToMax()
        }}
      >
        {!maxModeOn ? this.context.t('max') : '' ])}
      </div>
    );
  }

}

AmountMaxButton.contextTypes = {
  t: PropTypes.func,
}
