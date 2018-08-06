import React, { Component } from 'react'
import PropTypes from 'prop-types'
import PageContainer from '../../page-container'
import { Tabs, Tab } from '../../tabs'

export default class GasModalPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideModal: PropTypes.func,
  }

  state = {}

  renderBasicTabContent () {
    return (
      <div className="basic-tab"/>
    )
  }

  renderAdvancedTabContent () {
    return (
      <div className="advanced-tab"/>
    )
  }

  renderInfoRow (className, totalLabelKey, fiatTotal, cryptoTotal) {
    return (
      <div className={className}>
        <div className="total-info">
          <span className="total-label">{`${this.context.t(totalLabelKey)}:`}</span><span className="total-value">{fiatTotal}</span>
        </div>
        <div className="sum-info">
          <span className="sum-label">{`${this.context.t('amountPlusTxFee')}`}</span><span className="sum-value">{cryptoTotal}</span>
        </div>
      </div>
    )
  }

  renderTabContent (mainTabContent) {
    return (
      <div className="gas-modal-content">
        { mainTabContent() }
        { this.renderInfoRow('info-row--fade', 'originalTotal', '$20.02 USD', '0.06685 ETH') }
        { this.renderInfoRow('info-row', 'newTotal', '$20.02 USD', '0.06685 ETH') }
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
      <PageContainer
        title={this.context.t('customGas')}
        subtitle={this.context.t('customGasSubTitle')}
        tabsComponent={this.renderTabs()}
        disabled={false}
        onCancel={() => hideModal()}
        onClose={() => hideModal()}
      />
    )
  }
}
