import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper'
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component'
import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group'
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs'
import { hexToDecimal } from '../../../../helpers/utils/conversions.util'
export default class SendGasRow extends Component {

  static propTypes = {
    balance: PropTypes.string,
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
    gasPriceSourceFromRPC: PropTypes.bool,
    getGasPriceRPC: PropTypes.func,
    gasPriceSource: PropTypes.bool,
    resetGasButtons: PropTypes.func,
    gasPrice: PropTypes.string,
    gasLimit: PropTypes.string,
    insufficientBalance: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  state = {
    initGasPrice: false,
  }

  renderAdvancedOptionsButton () {
    const { metricsEvent } = this.context
    const { showCustomizeGasModal } = this.props
    return (
      <div
        className="advanced-gas-options-btn"
        onClick={() => {
          metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Edit Screen',
              name: 'Clicked "Advanced Options"',
            },
          })
          showCustomizeGasModal()
        }}
      > { this.context.t('advancedOptions') }
      </div>
    )
  }

  renderGasPriceSource (gasPrice) {
    const { t } = this.context
    return (
      <div className="advanced-gas-options-btn">
        {t('gasPriceSource')} - Wei: { hexToDecimal(gasPrice) }
      </div>
    )
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
      gasLoadingError,
      gasTotal,
      showCustomizeGasModal,
      gasPriceButtonGroupProps,
      gasButtonGroupShown,
      advancedInlineGasShown,
      gasPriceSourceFromRPC,
      getGasPriceRPC,
      maxModeOn,
      resetGasButtons,
      setGasPrice,
      setGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
    } = this.props
    const { metricsEvent } = this.context

    if (gasPriceSourceFromRPC && !this.state.initGasPrice) {
      this.setState({ initGasPrice: true })
      getGasPriceRPC().then((gas) => {
        const _gasPrice = '0x' + gas.toString(16)
        setGasPrice(_gasPrice)
      }).catch(console.error)
    }

    const gasPriceButtonGroup = (
      <div>
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
    )
    const gasFeeDisplay = (
      <GasFeeDisplay
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
    )
    const advancedGasInputs = (
      <div>
        <AdvancedGasInputs
          updateCustomGasPrice={(newGasPrice) => setGasPrice(newGasPrice, gasLimit)}
          updateCustomGasLimit={(newGasLimit) => setGasLimit(newGasLimit, gasPrice)}
          customGasPrice={gasPrice}
          customGasLimit={gasLimit}
          insufficientBalance={insufficientBalance}
          customPriceIsSafe
          isSpeedUp={false}
        />
        { this.renderAdvancedOptionsButton() }
      </div>
    )

    if (gasPriceSourceFromRPC) {
      return (
        <div>
          { this.renderAdvancedOptionsButton() }
          { this.renderGasPriceSource(gasPrice) }
        </div>
      )
    } else {
      if (advancedInlineGasShown) {
        return advancedGasInputs
      } else if (gasButtonGroupShown) {
        return gasPriceButtonGroup
      } else {
        return gasFeeDisplay
      }
    }

  }

  render () {
    const { gasFeeError } = this.props

    return (
      <SendRowWrapper
        label={`${this.context.t('transactionFee')}:`}
        showError={gasFeeError}
        errorType="gasFee"
      >
        { this.renderContent() }
      </SendRowWrapper>
    )
  }

}
