import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component'
import GasPriceButtonGroup from '../../../gas-customization/gas-price-button-group'

export default class SendGasRow extends Component {

  static propTypes = {
    conversionRate: PropTypes.number,
    convertedCurrency: PropTypes.string,
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    gasPriceButtonGroupProps: PropTypes.object,
    gasButtonGroupShown: PropTypes.bool,
    resetGasButtons: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  render () {
    const {
      conversionRate,
      convertedCurrency,
      gasLoadingError,
      gasTotal,
      gasFeeError,
      showCustomizeGasModal,
      gasPriceButtonGroupProps,
      gasButtonGroupShown,
      resetGasButtons,
    } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('transactionFee')}:`}
        showError={gasFeeError}
        errorType={'gasFee'}
      >
        {gasButtonGroupShown
         ? <div>
            <GasPriceButtonGroup
              className="gas-price-button-group--small"
              showCheck={false}
              {...gasPriceButtonGroupProps}
            />
            <div className="advanced-gas-options-btn" onClick={() => showCustomizeGasModal()}>
              { this.context.t('advancedOptions') }
            </div>
          </div>
        : <GasFeeDisplay
            conversionRate={conversionRate}
            convertedCurrency={convertedCurrency}
            gasLoadingError={gasLoadingError}
            gasTotal={gasTotal}
            onReset={resetGasButtons}
            onClick={() => showCustomizeGasModal()}
          />}

      </SendRowWrapper>
    )
  }

}
