import React, {Component} from 'react'
import PropTypes from 'prop-types'
import CurrencyDisplay from '../../../../send/currency-display'


export default class GasFeeDisplay extends Component {

  static propTypes = {
    conversionRate: PropTypes.number,
    primaryCurrency: PropTypes.string,
    convertedCurrency: PropTypes.string,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    showGasButtonGroup: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const {
      conversionRate,
      gasTotal,
      primaryCurrency = 'ETH',
      convertedCurrency,
      gasLoadingError,
      showGasButtonGroup,
    } = this.props

    return (
      <div className="send-v2__gas-fee-display">
        {gasTotal
          ? <CurrencyDisplay
              primaryCurrency={primaryCurrency}
              convertedCurrency={convertedCurrency}
              value={gasTotal}
              conversionRate={conversionRate}
              gasLoadingError={gasLoadingError}
              convertedPrefix={'$'}
              readOnly
            />
          : gasLoadingError
            ? <div className="currency-display.currency-display--message">
                {this.context.t('setGasPrice')}
              </div>
            : <div className="currency-display">
                {this.context.t('loading')}
              </div>
        }
        <button
          className="gas-fee-reset"
          onClick={showGasButtonGroup}
        >
          { this.context.t('reset') }
        </button>
      </div>
    )
  }
}
