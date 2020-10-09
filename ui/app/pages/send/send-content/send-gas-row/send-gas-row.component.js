import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SendRowWrapper from '../send-row-wrapper'
// import GasFeeDisplay from './gas-fee-display/gas-fee-display.component'
// import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group'
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs'

export default class SendGasRow extends Component {
  static propTypes = {
    isSimpleTx: PropTypes.bool,
    balance: PropTypes.string,
    gasAndCollateralFeeError: PropTypes.bool,
    // gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    // storageTotal: PropTypes.string,
    // maxModeOn: PropTypes.bool,
    showCustomizeGasModal: PropTypes.func,
    selectedToken: PropTypes.object,
    setAmountToMax: PropTypes.func,
    setGasPrice: PropTypes.func,
    setGasLimit: PropTypes.func,
    setStorageLimit: PropTypes.func,
    tokenBalance: PropTypes.string,
    // gasPriceButtonGroupProps: PropTypes.object,
    // gasButtonGroupShown: PropTypes.bool,
    advancedInlineGasShown: PropTypes.bool,
    // resetGasButtons: PropTypes.func,
    gasPrice: PropTypes.string,
    gasLimit: PropTypes.string,
    storageLimit: PropTypes.string,
    insufficientBalance: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  // TODO: add this back when we have gas station
  renderAdvancedOptionsButton () {
    const { metricsEvent } = this.context
    const { showCustomizeGasModal } = this.props
    return (
      false && (
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
        >
          {this.context.t('advancedOptions')}
        </div>
      )
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
      gasAndCollateralTotal: gasTotal,
      selectedToken,
      tokenBalance,
    })
  }

  renderContent (showInputType = 'all') {
    const {
      isSimpleTx,
      // gasLoadingError,
      // gasTotal,
      // storageTotal,
      // showCustomizeGasModal,
      // gasPriceButtonGroupProps,
      // gasButtonGroupShown,
      advancedInlineGasShown,
      // maxModeOn,
      // resetGasButtons,
      setGasPrice,
      setGasLimit,
      setStorageLimit,
      gasPrice,
      gasLimit,
      storageLimit,
      insufficientBalance,
    } = this.props
    // const { metricsEvent } = this.context

    // const gasPriceButtonGroup = (
    //   <div>
    //     <GasPriceButtonGroup
    //       className="gas-price-button-group--small"
    //       showCheck={false}
    //       {...gasPriceButtonGroupProps}
    //       handleGasPriceSelection={async (...args) => {
    //         metricsEvent({
    //           eventOpts: {
    //             category: 'Transactions',
    //             action: 'Edit Screen',
    //             name: 'Changed Gas Button',
    //           },
    //         })
    //         await gasPriceButtonGroupProps.handleGasPriceSelection(...args)
    //         if (maxModeOn) {
    //           this.setMaxAmount()
    //         }
    //       }}
    //     />
    //     {this.renderAdvancedOptionsButton()}
    //   </div>
    // )
    // const gasAndCollateralFeeDisplay = (
    //   <GasFeeDisplay
    //     gasLoadingError={gasLoadingError}
    //     gasTotal={gasTotal}
    //     storageTotal={storageTotal}
    //     gasAndCollateralTotal={gasTotal}
    //     onReset={() => {
    //       resetGasButtons()
    //       if (maxModeOn) {
    //         this.setMaxAmount()
    //       }
    //     }}
    //     onClick={() => showCustomizeGasModal()}
    //   />
    // )
    const advancedGasInputs = (
      <div>
        <AdvancedGasInputs
          updateCustomGasPrice={(newGasPrice) =>
            setGasPrice(newGasPrice, gasLimit)
          }
          updateCustomGasLimit={(newGasLimit) =>
            setGasLimit(newGasLimit, gasPrice)
          }
          updateCustomStorageLimit={(newStorageLimit) =>
            setStorageLimit(newStorageLimit)
          }
          customGasPrice={gasPrice}
          customGasLimit={gasLimit}
          customStorageLimit={storageLimit}
          insufficientBalance={insufficientBalance}
          customPriceIsSafe
          isSimpleTx={isSimpleTx}
          isSpeedUp={false}
          showInputType={showInputType}
        />
        {this.renderAdvancedOptionsButton()}
      </div>
    )

    if (advancedInlineGasShown) {
      return advancedGasInputs
      // } else if (gasButtonGroupShown) {
      //   return gasPriceButtonGroup
      // } else {
      //   return gasAndCollateralFeeDisplay
    }
  }

  render () {
    const {
      gasAndCollateralFeeError,
      isSimpleTx,
      advancedInlineGasShown,
    } = this.props
    if (!advancedInlineGasShown) {
      return <div></div>
    }

    const gasFeeRow = (
      <SendRowWrapper
        key="fee"
        label={`${this.context.t('transactionFee')}:`}
        showError={gasAndCollateralFeeError}
        errorType="gasAndCollateralFee"
      >
        {this.renderContent('fee')}
      </SendRowWrapper>
    )
    if (!advancedInlineGasShown) {
      return gasFeeRow
    }

    return [
      gasFeeRow,
      advancedInlineGasShown && !isSimpleTx && (
        <SendRowWrapper
          key="collateral"
          label={`${this.context.t('transactionCollateral')}:`}
          showError={gasAndCollateralFeeError}
          errorType="gasAndCollateralFee"
        >
          {this.renderContent('collateral')}
        </SendRowWrapper>
      ),
    ]
  }
}
