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
    customModalGasPriceInHex: PropTypes.string,
    customModalGasLimitInHex: PropTypes.string,
    cancelAndClose: PropTypes.func,
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
        timeRemaining={'1 min 31 sec'}
        totalFee={newTotalFiat}
      />
    )
  }

  renderInfoRows (newTotalFiat, newTotalEth, sendAmount, transactionFee) {
    const baseClassName = 'gas-modal-content__info-row'

    return (
      <div>
        <div className={baseClassName}>
          <div className={`${baseClassName}__send-info`}>
            <span className={`${baseClassName}__send-info__label`}>{`Send Amount`}</span>
            <span className={`${baseClassName}__send-info__value`}>{sendAmount}</span>
          </div>
          <div className={`${baseClassName}__transaction-info`}>
            <span className={`${baseClassName}__transaction-info__label`}>{`Transaction Fee`}</span>
            <span className={`${baseClassName}__transaction-info__value`}>{transactionFee}</span>
          </div>
          <div className={`${baseClassName}__total-info`}>
            <span className={`${baseClassName}__total-info__label`}>{`New Total`}</span>
            <span className={`${baseClassName}__total-info__value`}>{newTotalEth}</span>
          </div>
          <div className={`${baseClassName}__fiat-total-info`}>
            <span className={`${baseClassName}__fiat-total-info__value`}>{newTotalFiat}</span>
          </div>
        </div>
      </div>
    )
  }

  renderTabs ({
    originalTotalFiat,
    originalTotalEth,
    newTotalFiat,
    newTotalEth,
    sendAmount,
    transactionFee,
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
              { this.renderInfoRows(newTotalFiat, newTotalEth, sendAmount, transactionFee) }
            </div>
          </Tab>
        )}
      </Tabs>
    )
  }

  render () {
    const {
      cancelAndClose,
      infoRowProps,
      onSubmit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      ...tabProps
    } = this.props

    return (
      <div className="gas-modal-page-container">
        <PageContainer
          title={this.context.t('customGas')}
          subtitle={this.context.t('customGasSubTitle')}
          tabsComponent={this.renderTabs(infoRowProps, tabProps)}
          disabled={false}
          onCancel={() => cancelAndClose()}
          onClose={() => cancelAndClose()}
          onSubmit={() => {
            onSubmit(customModalGasLimitInHex, customModalGasPriceInHex)
            cancelAndClose()
          }}
          submitText={this.context.t('save')}
          headerCloseText={'Close'}
          hideCancel={true}
        />
      </div>
    )
  }
}
