import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainer from '../../page-container'
import { Tabs, Tab } from '../../tabs'
import AdvancedTabContent from './advanced-tab-content'
import BasicTabContent from './basic-tab-content'

export default class GasModalPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideModal: PropTypes.func,
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customGasPrice: PropTypes.number,
    customGasLimit: PropTypes.number,
    gasPriceButtonGroupProps: PropTypes.object,
    infoRowProps: PropTypes.shape({
      originalTotalFiat: PropTypes.string,
      originalTotalEth: PropTypes.string,
      newTotalFiat: PropTypes.string,
      newTotalEth: PropTypes.string,
    }),
    onSubmit: PropTypes.func,
    customGasPriceInHex: PropTypes.string,
    customGasLimitInHex: PropTypes.string,
  }

  state = {}

  renderBasicTabContent (gasPriceButtonGroupProps) {
    return (
      <BasicTabContent
        gasPriceButtonGroupProps={gasPriceButtonGroupProps}
      />
    )
  }

  renderAdvancedTabContent ({
    convertThenUpdateCustomGasPrice,
    convertThenUpdateCustomGasLimit,
    customGasPrice,
    customGasLimit,
    newTotalFiat,
  }) {
    return (
      <AdvancedTabContent
        updateCustomGasPrice={convertThenUpdateCustomGasPrice}
        updateCustomGasLimit={convertThenUpdateCustomGasLimit}
        customGasPrice={customGasPrice}
        customGasLimit={customGasLimit}
        millisecondsRemaining={91000}
        totalFee={newTotalFiat}
      />
    )
  }

  renderInfoRow (className, totalLabelKey, fiatTotal, cryptoTotal) {
    return (
      <div className={className}>
        <div className={`${className}__total-info`}>
          <span className={`${className}__total-info__total-label`}>{`${this.context.t(totalLabelKey)}:`}</span>
          <span className={`${className}__total-info__total-value`}>{fiatTotal}</span>
        </div>
        <div className={`${className}__sum-info`}>
          <span className={`${className}__sum-info__sum-label`}>{`${this.context.t('amountPlusTxFee')}`}</span>
          <span className={`${className}__sum-info__sum-value`}>{cryptoTotal}</span>
        </div>
      </div>
    )
  }

  renderInfoRows (originalTotalFiat, originalTotalEth, newTotalFiat, newTotalEth) {
    return (
      <div>
        { this.renderInfoRow('gas-modal-content__info-row--fade', 'originalTotal', originalTotalFiat, originalTotalEth) }
        { this.renderInfoRow('gas-modal-content__info-row', 'newTotal', newTotalFiat, newTotalEth) }
      </div>
    )
  }

  renderTabs ({
    originalTotalFiat,
    originalTotalEth,
    newTotalFiat,
    newTotalEth,
  },
  {
    gasPriceButtonGroupProps,
    hideBasic,
    ...advancedTabProps
  }) {
    let tabsToRender = [
      { name: 'basic', content: this.renderBasicTabContent(gasPriceButtonGroupProps) },
      { name: 'advanced', content: this.renderAdvancedTabContent(advancedTabProps) },
    ]

    if (hideBasic) {
      tabsToRender = tabsToRender.slice(1)
    }

    return (
      <Tabs>
        {tabsToRender.map(({ name, content }, i) => <Tab name={this.context.t(name)} key={`gas-modal-tab-${i}`}>
            <div className="gas-modal-content">
              { content }
              { this.renderInfoRows(originalTotalFiat, originalTotalEth, newTotalFiat, newTotalEth) }
            </div>
          </Tab>
        )}
      </Tabs>
    )
  }

  render () {
    const {
      hideModal,
      infoRowProps,
      onSubmit,
      customGasPriceInHex,
      customGasLimitInHex,
      ...tabProps
    } = this.props

    return (
      <div className="gas-modal-page-container">
        <PageContainer
          title={this.context.t('customGas')}
          subtitle={this.context.t('customGasSubTitle')}
          tabsComponent={this.renderTabs(infoRowProps, tabProps)}
          disabled={false}
          onCancel={() => hideModal()}
          onClose={() => hideModal()}
          onSubmit={() => {
            onSubmit(customGasLimitInHex, customGasPriceInHex)
            hideModal()
          }}
          submitText={this.context.t('save')}
        />
      </div>
    )
  }
}
