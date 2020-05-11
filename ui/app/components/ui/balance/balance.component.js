import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../identicon'
import UserPreferencedCurrencyDisplay from '../../app/user-preferenced-currency-display'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'

export default class Balance extends PureComponent {
  static propTypes = {
    account: PropTypes.object,
    showFiat: PropTypes.bool,
  }

  renderBalance () {
    const { account, showFiat } = this.props
    const balanceValue = account && account.balance

    return (
      <div className="flex-column balance-display">
        <UserPreferencedCurrencyDisplay
          className="token-amount"
          value={balanceValue}
          type={PRIMARY}
          ethNumberOfDecimals={4}
        />
        {
          showFiat && (
            <UserPreferencedCurrencyDisplay
              value={balanceValue}
              type={SECONDARY}
              ethNumberOfDecimals={4}
            />
          )
        }
      </div>
    )
  }

  render () {
    return (
      <div className="balance-container">
        <Identicon
          diameter={50}
        />
        { this.renderBalance() }
      </div>
    )
  }
}
