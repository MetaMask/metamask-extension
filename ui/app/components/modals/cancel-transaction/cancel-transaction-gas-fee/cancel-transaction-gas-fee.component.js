import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import CurrencyDisplay from '../../../currency-display'
import { ETH } from '../../../../constants/common'

export default class CancelTransaction extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    value: PropTypes.string,
  }

  render () {
    const { className, value } = this.props
    console.log('VALUE', value)

    return (
      <div className={classnames('cancel-transaction-gas-fee', className)}>
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
