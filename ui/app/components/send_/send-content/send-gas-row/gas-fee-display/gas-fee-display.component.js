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
    onClick: PropTypes.func,
  };

  render () {
    const {
      conversionRate,
      gasTotal,
      onClick,
      primaryCurrency = 'ETH',
      convertedCurrency,
      gasLoadingError,
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
          className="sliders-icon-container"
          onClick={onClick}
          disabled={!gasTotal && !gasLoadingError}
        >
          <i className="fa fa-sliders sliders-icon" />
        </button>
      </div>
    )
  }
}

GasFeeDisplay.contextTypes = {
  t: PropTypes.func,
}
