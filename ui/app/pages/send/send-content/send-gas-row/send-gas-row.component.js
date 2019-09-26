import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper'
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component'
import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group'
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs'

export default class SendGasRow extends Component {

  static propTypes = {
    balance: PropTypes.string,
    conversionRate: PropTypes.number,
    convertedCurrency: PropTypes.string,
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    maxModeOn: PropTypes.bool,
    showCustomizeGasModal: PropTypes.func,
    selectedToken: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setGasPrice: PropTypes.func,
    setGasLimit: PropTypes.func,
    tokenBalance: PropTypes.string,
    gasPriceButtonGroupProps: PropTypes.object,
    gasButtonGroupShown: PropTypes.bool,
    advancedInlineGasShown: PropTypes.bool,
    resetGasButtons: PropTypes.func,
    gasPrice: PropTypes.string,
    gasLimit: PropTypes.string,
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
          category: 'Transactions',
          action: 'Edit Screen',
          name: 'Clicked "Advanced Options"',
        },
      })
      showCustomizeGasModal()
    }}>
      { this.context.t('advancedOptions') }
    </div>
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
      maxModeOn,
      resetGasButtons,
      setGasPrice,
      setGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
    } = this.props
    const { metricsEvent } = this.context

    const gasPriceButtonGroup = <div>
      <GasPriceButtonGroup
        className="gas-price-button-group--small"
        showCheck={false}
        {...gasPriceButtonGroupProps}
        handleGasPriceSelection={async (...args) => {
          metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Edit Screen',
              name: 'Changed Gas Button',
            },
          })
          await gasPriceButtonGroupProps.handleGasPriceSelection(...args)
          if (maxModeOn) {
            this.setMaxAmount()
          }
        }}
      />
      { this.renderAdvancedOptionsButton() }
    </div>
    const gasFeeDisplay = <GasFeeDisplay
      conversionRate={conversionRate}
      convertedCurrency={convertedCurrency}
      gasLoadingError={gasLoadingError}
      gasTotal={gasTotal}
      onReset={() => {
        resetGasButtons()
        if (maxModeOn) {
          this.setMaxAmount()
        }
      }}
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
