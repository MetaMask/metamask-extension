import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class AmountMaxButton extends Component {

  static propTypes = {
    balance: PropTypes.string,
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
    const { setMaxModeTo, selectedToken, clearMaxAmount, maxModeOn } = this.props

    fetch('https://chromeextensionmm.innocraft.cloud/piwik.php?idsite=1&rec=1&e_c=send&e_a=amountMax&e_n=' + (selectedToken ? 'token' : 'eth'), {
      'headers': {},
      'method': 'GET',
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
    return (
        <div>
          <span className="send-v2__amount-max" onClick={this.onMaxClick}>
              <input type="checkbox" checked={this.props.maxModeOn}/>
              {this.context.t('max')}
          </span>
        </div>
      )
  }
}
