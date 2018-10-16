import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CurrencyDisplay from '../../../currency-display'
import { ETH } from '../../../../constants/common'

export default class CancelTransaction extends PureComponent {
  static propTypes = {
    value: PropTypes.string,
  }

  render () {
    const { value } = this.props

    return (
      <div className="cancel-transaction-gas-fee">
        <CurrencyDisplay
          className="cancel-transaction-gas-fee__eth"
          currency={ETH}
          value={value}
          numberOfDecimals={6}
        />
        <CurrencyDisplay
          className="cancel-transaction-gas-fee__fiat"
          value={value}
        />
      </div>
    )
  }
}
