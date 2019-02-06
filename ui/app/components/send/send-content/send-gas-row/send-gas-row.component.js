import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper/'
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component'
import GasPriceButtonGroup from '../../../gas-customization/gas-price-button-group'
import AdvancedGasInputs from '../../../gas-customization/advanced-gas-inputs'

export default class SendGasRow extends Component {

  static propTypes = {
    conversionRate: PropTypes.number,
    convertedCurrency: PropTypes.string,
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    setGasPrice: PropTypes.func,
    setGasLimit: PropTypes.func,
    gasPriceButtonGroupProps: PropTypes.object,
    gasButtonGroupShown: PropTypes.bool,
    advancedInlineGasShown: PropTypes.bool,
    resetGasButtons: PropTypes.func,
    gasPrice: PropTypes.number,
    gasLimit: PropTypes.number,
    insufficientBalance: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  renderAdvancedOptionsButton () {
    const { metricsEvent } = this.context
    const { showCustomizeGasModal } = this.props
    return <div className="advanced-gas-options-btn" onClick={() => {
      metricsEvent({
        eventOpts: {
          category: 'Activation',
          action: 'userOpens',
          name: 'sendOpenCustomizeGas',
        },
        pageOpts: {
          section: 'formConent',
          component: 'sendScreenGasRow',
        },
      })
      showCustomizeGasModal()
    }}>
      { this.context.t('advancedOptions') }
    </div>
  }

  renderContent () {
    const {
      conversionRate,
      convertedCurrency,
      gasLoadingError,
      gasTotal,
      showCustomizeGasModal,
      gasPriceButtonGroupProps,
      gasButtonGroupShown,
      advancedInlineGasShown,
      resetGasButtons,
      setGasPrice,
      setGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
    } = this.props

    const gasPriceButtonGroup = <div>
        <GasPriceButtonGroup
          className="gas-price-button-group--small"
          showCheck={false}
          {...gasPriceButtonGroupProps}
        />
        { this.renderAdvancedOptionsButton() }
      </div>
    const gasFeeDisplay = <GasFeeDisplay
      conversionRate={conversionRate}
      convertedCurrency={convertedCurrency}
      gasLoadingError={gasLoadingError}
      gasTotal={gasTotal}
      onReset={resetGasButtons}
      onClick={() => showCustomizeGasModal()}
    />
    const advancedGasInputs = <div>
      <AdvancedGasInputs
        updateCustomGasPrice={newGasPrice => setGasPrice(newGasPrice, gasLimit)}
        updateCustomGasLimit={newGasLimit => setGasLimit(newGasLimit, gasPrice)}
        customGasPrice={gasPrice}
        customGasLimit={gasLimit}
        insufficientBalance={insufficientBalance}
        customPriceIsSafe={true}
        isSpeedUp={false}
      />
      { this.renderAdvancedOptionsButton() }
     </div>

    if (advancedInlineGasShown) {
      return advancedGasInputs
    } else if (gasButtonGroupShown) {
      return gasPriceButtonGroup
    } else {
      return gasFeeDisplay
    }
  }

  render () {
    const { gasFeeError } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('transactionFee')}:`}
        showError={gasFeeError}
        errorType={'gasFee'}
      >
        { this.renderContent() }
      </SendRowWrapper>
    )
  }

}
