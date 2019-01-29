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
    const { setMaxModeTo, selectedToken } = this.props

    fetch('https://chromeextensionmm.innocraft.cloud/piwik.php?idsite=1&rec=1&e_c=send&e_a=amountMax&e_n=' + (selectedToken ? 'token' : 'eth'), {
      'headers': {},
      'method': 'GET',
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
