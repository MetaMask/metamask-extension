import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AdvancedGasInputs from '../../advanced-gas-inputs';

export default class AdvancedTabContent extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    updateCustomGasPrice: PropTypes.func,
    updateCustomGasLimit: PropTypes.func,
    customModalGasPriceInHex: PropTypes.string,
    customModalGasLimitInHex: PropTypes.string,
    transactionFee: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    customPriceIsSafe: PropTypes.bool,
    isSpeedUp: PropTypes.bool,
    customGasLimitMessage: PropTypes.string,
    minimumGasLimit: PropTypes.number,
    customPriceIsExcessive: PropTypes.bool.isRequired,
  };

  renderDataSummary(transactionFee) {
    return (
      <div className="advanced-tab__transaction-data-summary">
        <div className="advanced-tab__transaction-data-summary__titles">
          <span>{this.context.t('newTransactionFee')}</span>
        </div>
        <div className="advanced-tab__transaction-data-summary__container">
          <div className="advanced-tab__transaction-data-summary__fee">
            {transactionFee}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const {
      updateCustomGasPrice,
      updateCustomGasLimit,
      customModalGasPriceInHex,
      customModalGasLimitInHex,
      insufficientBalance,
      customPriceIsSafe,
      isSpeedUp,
      transactionFee,
      customGasLimitMessage,
      minimumGasLimit,
      customPriceIsExcessive,
    } = this.props;

    return (
      <div className="advanced-tab">
        {this.renderDataSummary(transactionFee)}
        <div className="advanced-tab__fee-chart">
          <div className="advanced-tab__gas-inputs">
            <AdvancedGasInputs
              updateCustomGasPrice={updateCustomGasPrice}
              updateCustomGasLimit={updateCustomGasLimit}
              customGasPrice={customModalGasPriceInHex}
              customGasLimit={customModalGasLimitInHex}
              insufficientBalance={insufficientBalance}
              customPriceIsSafe={customPriceIsSafe}
              isSpeedUp={isSpeedUp}
              customGasLimitMessage={customGasLimitMessage}
              minimumGasLimit={minimumGasLimit}
              customPriceIsExcessive={customPriceIsExcessive}
            />
          </div>
        </div>
      </div>
    );
  }
}
