import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainer from '../../../ui/page-container'
import { Tabs, Tab } from '../../../ui/tabs'
import AdvancedTabContent from './advanced-tab-content'
import BasicTabContent from './basic-tab-content'

export default class GasModalPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
    // metricsEvent: PropTypes.func,
  }

  static propTypes = {
    hideBasic: PropTypes.bool,
    isSimpleTx: PropTypes.bool,
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    updateCustomStorageLimit: PropTypes.func,
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
      sponsoredFee: PropTypes.string,
    }),
    onSubmit: PropTypes.func,
    customModalGasPriceInHex: PropTypes.string,
    customModalGasLimitInHex: PropTypes.string,
    customModalStorageLimitInHex: PropTypes.string,
    cancelAndClose: PropTypes.func,
    blockTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    isRetry: PropTypes.bool,
    disableSave: PropTypes.bool,
    isEthereumNetwork: PropTypes.bool,
  }

  state = {}

  componentDidMount () {
    const promise = this.props.hideBasic
      ? Promise.resolve(this.props.blockTime)
      : this.props
        .fetchBasicGasAndTimeEstimates()
        .then((basicEstimates) => basicEstimates.blockTime)

    promise.then((blockTime) => {
      this.props.fetchGasEstimates(blockTime)
    })
  }

  renderBasicTabContent (gasPriceButtonGroupProps) {
    return (
      <BasicTabContent gasPriceButtonGroupProps={gasPriceButtonGroupProps} />
    )
  }

  renderAdvancedTabContent () {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      updateCustomStorageLimit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      customModalStorageLimitInHex,
      gasChartProps,
      currentTimeEstimate,
      insufficientBalance,
      gasEstimatesLoading,
      customPriceIsSafe,
      isSpeedUp,
      isSimpleTx,
      isRetry,
      infoRowProps: { transactionFee },
      isEthereumNetwork,
    } = this.props

    return (
      <AdvancedTabContent
        updateCustomStorageLimit={updateCustomStorageLimit}
        updateCustomGasPrice={updateCustomGasPrice}
        updateCustomGasLimit={updateCustomGasLimit}
        customModalGasPriceInHex={customModalGasPriceInHex}
        customModalGasLimitInHex={customModalGasLimitInHex}
        customModalStorageLimitInHex={customModalStorageLimitInHex}
        timeRemaining={currentTimeEstimate}
        transactionFee={transactionFee}
        gasChartProps={gasChartProps}
        insufficientBalance={insufficientBalance}
        gasEstimatesLoading={gasEstimatesLoading}
        customPriceIsSafe={customPriceIsSafe}
        isSpeedUp={isSpeedUp}
        isSimpleTx={isSimpleTx}
        isRetry={isRetry}
        isEthereumNetwork={isEthereumNetwork}
      />
    )
  }

  renderInfoRows (
    newTotalFiat,
    newTotalEth,
    sendAmount,
    transactionFee,
    sponsoredFee
  ) {
    const zeroSponsoredFee = sponsoredFee === '0 CFX'
    return (
      <div className="gas-modal-content__info-row-wrapper">
        <div className="gas-modal-content__info-row">
          <div className="gas-modal-content__info-row__send-info">
            <span className="gas-modal-content__info-row__send-info__label">
              {this.context.t('sendAmount')}
            </span>
            <span className="gas-modal-content__info-row__send-info__value">
              {sendAmount}
            </span>
          </div>
          <div className="gas-modal-content__info-row__transaction-info">
            <span className="gas-modal-content__info-row__transaction-info__label">
              {this.context.t('transactionFee')}
            </span>
            <span className="gas-modal-content__info-row__transaction-info__value">
              {transactionFee}
            </span>
          </div>
          {!zeroSponsoredFee && (
            <div className="gas-modal-content__info-row__transaction-info gas-modal-content__info-row__sponsor-info">
              <span className="gas-modal-content__info-row__transaction-info__label gas-modal-content__info-row__sponsor-info__label">
                {this.context.t('sponsoredFee')}
              </span>
              <span className="gas-modal-content__info-row__transaction-info__value gas-modal-content__info-row__sponsor-info__value">
                {sponsoredFee}
              </span>
            </div>
          )}
          <div className="gas-modal-content__info-row__total-info">
            <span className="gas-modal-content__info-row__total-info__label">
              {this.context.t('newTotal')}
            </span>
            <span className="gas-modal-content__info-row__total-info__value">
              {newTotalEth}
            </span>
          </div>
          <div className="gas-modal-content__info-row__fiat-total-info">
            <span className="gas-modal-content__info-row__fiat-total-info__value">
              {newTotalFiat}
            </span>
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
        sponsoredFee,
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
      <Tabs>
        {tabsToRender.map(({ name, content }, i) => (
          <Tab name={name} key={`gas-modal-tab-${i}`}>
            <div className="gas-modal-content">
              {content}
              {this.renderInfoRows(
                newTotalFiat,
                newTotalEth,
                sendAmount,
                transactionFee,
                sponsoredFee
              )}
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
      customModalStorageLimitInHex,
      disableSave,
      // isSpeedUp,
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
            /* if (isSpeedUp) { */
            /*   this.context.metricsEvent({ */
            /*     eventOpts: { */
            /*       category: 'Navigation', */
            /*       action: 'Activity Log', */
            /*       name: 'Saved "Speed Up"', */
            /*     }, */
            /*   }) */
            /* } */
            onSubmit(
              customModalGasLimitInHex,
              customModalGasPriceInHex,
              customModalStorageLimitInHex
            )
          }}
          submitText={this.context.t('save')}
          headerCloseText={this.context.t('close')}
          hideCancel
        />
      </div>
    )
  }
}
