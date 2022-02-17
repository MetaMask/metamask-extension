import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PageContainer from '../../../ui/page-container';
import { Tabs, Tab } from '../../../ui/tabs';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../../../store/actions';
import AdvancedTabContent from './advanced-tab-content';
import BasicTabContent from './basic-tab-content';

export default class GasModalPageContainer extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    hideBasic: PropTypes.bool,
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    insufficientBalance: PropTypes.bool,
    gasPriceButtonGroupProps: PropTypes.object,
    infoRowProps: PropTypes.shape({
      originalTotalFiat: PropTypes.string,
      originalTotalEth: PropTypes.string,
      newTotalFiat: PropTypes.string,
      newTotalEth: PropTypes.string,
      sendAmount: PropTypes.string,
      transactionFee: PropTypes.string,
    }),
    onSubmit: PropTypes.func,
    customModalGasPriceInHex: PropTypes.string,
    customModalGasLimitInHex: PropTypes.string,
    cancelAndClose: PropTypes.func,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    isRetry: PropTypes.bool,
    disableSave: PropTypes.bool,
    customPriceIsExcessive: PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      pollingToken: undefined,
    };
  }

  componentDidMount() {
    this._isMounted = true;
    getGasFeeEstimatesAndStartPolling().then((pollingToken) => {
      if (this._isMounted) {
        addPollingTokenToAppState(pollingToken);
        this.setState({ pollingToken });
      } else {
        disconnectGasFeeEstimatePoller(pollingToken);
        removePollingTokenFromAppState(pollingToken);
      }
    });
    window.addEventListener('beforeunload', this._beforeUnload);
  }

  _beforeUnload = () => {
    this._isMounted = false;
    if (this.state.pollingToken) {
      disconnectGasFeeEstimatePoller(this.state.pollingToken);
      removePollingTokenFromAppState(this.state.pollingToken);
    }
  };

  componentWillUnmount() {
    this._beforeUnload();
    window.removeEventListener('beforeunload', this._beforeUnload);
  }

  renderBasicTabContent(gasPriceButtonGroupProps) {
    return (
      <BasicTabContent gasPriceButtonGroupProps={gasPriceButtonGroupProps} />
    );
  }

  renderAdvancedTabContent() {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      isRetry,
      customPriceIsExcessive,
      infoRowProps: { transactionFee },
    } = this.props;

    return (
      <AdvancedTabContent
        updateCustomGasPrice={updateCustomGasPrice}
        updateCustomGasLimit={updateCustomGasLimit}
        customModalGasPriceInHex={customModalGasPriceInHex}
        customModalGasLimitInHex={customModalGasLimitInHex}
        transactionFee={transactionFee}
        insufficientBalance={insufficientBalance}
        customPriceIsSafe={customPriceIsSafe}
        isSpeedUp={isSpeedUp}
        isRetry={isRetry}
        customPriceIsExcessive={customPriceIsExcessive}
      />
    );
  }

  renderInfoRows(newTotalFiat, newTotalEth, sendAmount, transactionFee) {
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
    );
  }

  renderTabs() {
    const {
      gasPriceButtonGroupProps,
      hideBasic,
      infoRowProps: { newTotalFiat, newTotalEth, sendAmount, transactionFee },
    } = this.props;

    let tabsToRender;
    if (hideBasic) {
      tabsToRender = [
        {
          name: this.context.t('advanced'),
          content: this.renderAdvancedTabContent(),
        },
      ];
    } else {
      tabsToRender = [
        {
          name: this.context.t('basic'),
          content: this.renderBasicTabContent(gasPriceButtonGroupProps),
        },
        {
          name: this.context.t('advanced'),
          content: this.renderAdvancedTabContent(),
        },
      ];
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
              )}
            </div>
          </Tab>
        ))}
      </Tabs>
    );
  }

  render() {
    const {
      cancelAndClose,
      onSubmit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      disableSave,
      isSpeedUp,
    } = this.props;

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
              });
            }
            onSubmit(customModalGasLimitInHex, customModalGasPriceInHex);
          }}
          submitText={this.context.t('save')}
          headerCloseText={this.context.t('close')}
          hideCancel
        />
      </div>
    );
  }
}
