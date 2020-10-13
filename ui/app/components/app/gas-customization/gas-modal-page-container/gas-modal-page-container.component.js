import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainer from '../../../ui/page-container'
import { Tabs, Tab } from '../../../ui/tabs'
import { calcGasTotal } from '../../../../pages/send/send.utils'
import {
  sumHexWEIsToRenderableFiat,
} from '../../../../helpers/utils/conversions.util'
import AdvancedTabContent from './advanced-tab-content'
import BasicTabContent from './basic-tab-content'

export default class GasModalPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
    trackEvent: PropTypes.func,
  }

  static propTypes = {
    hideBasic: PropTypes.bool,
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    currentTimeEstimate: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    fetchBasicGasAndTimeEstimates: PropTypes.func,
    fetchGasEstimates: PropTypes.func,
    gasPriceButtonGroupProps: PropTypes.object,
    gasChartProps: PropTypes.object,
    gasEstimatesLoading: PropTypes.bool,
    infoRowProps: PropTypes.shape({
      originalTotalFiat: PropTypes.string,
      originalTotalEth: PropTypes.string,
      newTotalFiat: PropTypes.string,
      newTotalEth: PropTypes.string,
      sendAmount: PropTypes.string,
      transactionFee: PropTypes.string,
      extraInfoRow: PropTypes.shape({ label: PropTypes.string, value: PropTypes.string }),
    }),
    onSubmit: PropTypes.func,
    customModalGasPriceInHex: PropTypes.string,
    customModalGasLimitInHex: PropTypes.string,
    cancelAndClose: PropTypes.func,
    blockTime: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    isRetry: PropTypes.bool,
    disableSave: PropTypes.bool,
    isEthereumNetwork: PropTypes.bool,
    customGasLimitMessage: PropTypes.string,
    customTotalSupplement: PropTypes.string,
    isSwap: PropTypes.boolean,
    value: PropTypes.string,
    conversionRate: PropTypes.string,
  }

  state = {
    selectedTab: 'Basic',
  }

  componentDidMount () {
    const promise = this.props.hideBasic
      ? Promise.resolve(this.props.blockTime)
      : this.props.fetchBasicGasAndTimeEstimates()
        .then((basicEstimates) => basicEstimates.blockTime)

    promise
      .then((blockTime) => {
        this.props.fetchGasEstimates(blockTime)
      })
  }

  renderBasicTabContent (gasPriceButtonGroupProps) {
    return (
      <BasicTabContent
        gasPriceButtonGroupProps={gasPriceButtonGroupProps}
      />
    )
  }

  renderAdvancedTabContent () {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      gasChartProps,
      currentTimeEstimate,
      insufficientBalance,
      gasEstimatesLoading,
      customPriceIsSafe,
      isSpeedUp,
      isRetry,
      infoRowProps: {
        transactionFee,
      },
      isEthereumNetwork,
      customGasLimitMessage,
    } = this.props

    return (
      <AdvancedTabContent
        updateCustomGasPrice={updateCustomGasPrice}
        updateCustomGasLimit={updateCustomGasLimit}
        customModalGasPriceInHex={customModalGasPriceInHex}
        customModalGasLimitInHex={customModalGasLimitInHex}
        customGasLimitMessage={customGasLimitMessage}
        timeRemaining={currentTimeEstimate}
        transactionFee={transactionFee}
        gasChartProps={gasChartProps}
        insufficientBalance={insufficientBalance}
        gasEstimatesLoading={gasEstimatesLoading}
        customPriceIsSafe={customPriceIsSafe}
        isSpeedUp={isSpeedUp}
        isRetry={isRetry}
        isEthereumNetwork={isEthereumNetwork}
      />
    )
  }

  renderInfoRows (newTotalFiat, newTotalEth, sendAmount, transactionFee, extraInfoRow) {
    return (
      <div className="gas-modal-content__info-row-wrapper">
        <div className="gas-modal-content__info-row">
          <div className="gas-modal-content__info-row__send-info">
            <span className="gas-modal-content__info-row__send-info__label">{this.context.t('sendAmount')}</span>
            <span className="gas-modal-content__info-row__send-info__value">{sendAmount}</span>
          </div>
          <div className="gas-modal-content__info-row__transaction-info">
            <span className="gas-modal-content__info-row__transaction-info__label">{this.context.t('transactionFee')}</span>
            <span className="gas-modal-content__info-row__transaction-info__value">{transactionFee}</span>
          </div>
          {extraInfoRow && (
            <div className="gas-modal-content__info-row__transaction-info">
              <span className="gas-modal-content__info-row__transaction-info__label">{extraInfoRow.label}</span>
              <span className="gas-modal-content__info-row__transaction-info__value">{extraInfoRow.value}</span>
            </div>
          )}
          <div className="gas-modal-content__info-row__total-info">
            <span className="gas-modal-content__info-row__total-info__label">{this.context.t('newTotal')}</span>
            <span className="gas-modal-content__info-row__total-info__value">{newTotalEth}</span>
          </div>
          <div className="gas-modal-content__info-row__fiat-total-info">
            <span className="gas-modal-content__info-row__fiat-total-info__value">{newTotalFiat}</span>
          </div>
        </div>
      </div>
    )
  }

  renderTabs () {
    const {
      gasPriceButtonGroupProps,
      hideBasic,
      infoRowProps: {
        newTotalFiat,
        newTotalEth,
        sendAmount,
        transactionFee,
        extraInfoRow,
      },
    } = this.props

    let tabsToRender = [
      {
        name: this.context.t('basic'),
        content: this.renderBasicTabContent(gasPriceButtonGroupProps),
      },
      {
        name: this.context.t('advanced'),
        content: this.renderAdvancedTabContent(),
      },
    ]

    if (hideBasic) {
      tabsToRender = tabsToRender.slice(1)
    }

    return (
      <Tabs onTabClick={(tabName) => this.setState({ selectedTab: tabName })}>
        {tabsToRender.map(({ name, content }, i) => (
          <Tab name={name} key={`gas-modal-tab-${i}`}>
            <div className="gas-modal-content">
              { content }
              { this.renderInfoRows(newTotalFiat, newTotalEth, sendAmount, transactionFee, extraInfoRow) }
            </div>
          </Tab>
        ))}
      </Tabs>
    )
  }

  render () {
    const {
      cancelAndClose,
      onSubmit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      disableSave,
      isSpeedUp,
    } = this.props

    return (
      <div className="gas-modal-page-container">
        <PageContainer
          title={this.context.t('customGas')}
          subtitle={this.context.t('customGasSubTitle')}
          tabsComponent={this.renderTabs()}
          disabled={disableSave}
          onCancel={() => cancelAndClose()}
          onClose={() => cancelAndClose()}
          onSubmit={() => {
            if (isSpeedUp) {
              this.context.metricsEvent({
                eventOpts: {
                  category: 'Navigation',
                  action: 'Activity Log',
                  name: 'Saved "Speed Up"',
                },
              })
            }
            if (this.props.isSwap) {
              const newSwapGasTotal = calcGasTotal(customModalGasLimitInHex, customModalGasPriceInHex)
              let speedSet = ''
              if (this.state.selectedTab === 'Basic') {
                const { gasButtonInfo } = this.props.gasPriceButtonGroupProps
                const selectedGasButtonInfo = gasButtonInfo.find(({ priceInHexWei }) => priceInHexWei === customModalGasPriceInHex)
                speedSet = selectedGasButtonInfo?.gasEstimateType || ''
              }

              this.context.trackEvent({
                event: 'Gas Fees Changed',
                category: 'swaps',
                properties: {
                  speed_set: speedSet,
                  gas_mode: this.state.selectedTab,
                  gas_fees: sumHexWEIsToRenderableFiat([this.props.value, newSwapGasTotal, this.props.customTotalSupplement], 'usd', this.props.conversionRate)?.slice(1),
                },
              })
            }
            onSubmit(customModalGasLimitInHex, customModalGasPriceInHex, this.state.selectedTab, this.context.mixPanelTrack)
          }}
          submitText={this.context.t('save')}
          headerCloseText={this.context.t('close')}
          hideCancel
        />
      </div>
    )
  }
}
