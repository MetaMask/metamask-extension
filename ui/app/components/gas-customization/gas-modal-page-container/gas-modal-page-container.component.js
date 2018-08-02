import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainer from '../../page-container'
import { Tabs, Tab } from '../../tabs'
import AdvancedTabContent from './advanced-tab-content'

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
  }

  state = {}

  renderBasicTabContent () {
    return (
      <div className="gas-modal-content__basic-tab"/>
    )
  }

  renderAdvancedTabContent = () => {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      customGasPrice,
      customGasLimit,
    } = this.props

    return (
      <AdvancedTabContent
        updateCustomGasPrice={updateCustomGasPrice}
        updateCustomGasLimit={updateCustomGasLimit}
        customGasPrice={customGasPrice}
        customGasLimit={customGasLimit}
        millisecondsRemaining={91000}
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

  renderTabContent (mainTabContent) {
    return (
      <div className="gas-modal-content">
        { mainTabContent() }
        { this.renderInfoRow('gas-modal-content__info-row--fade', 'originalTotal', '$20.02 USD', '0.06685 ETH') }
        { this.renderInfoRow('gas-modal-content__info-row', 'newTotal', '$20.02 USD', '0.06685 ETH') }
      </div>
    )
  }

  renderTabs () {
    return (
      <Tabs>
        <Tab name={this.context.t('basic')}>
          { this.renderTabContent(this.renderBasicTabContent) }
        </Tab>
        <Tab name={this.context.t('advanced')}>
          { this.renderTabContent(this.renderAdvancedTabContent) }
        </Tab>
      </Tabs>
    )
  }

  render () {
    const { hideModal } = this.props

    return (
      <div className="gas-modal-page-container">
        <PageContainer
          title={this.context.t('customGas')}
          subtitle={this.context.t('customGasSubTitle')}
          tabsComponent={this.renderTabs()}
          disabled={false}
          onCancel={() => hideModal()}
          onClose={() => hideModal()}
        />
      </div>
    )
  }
}
