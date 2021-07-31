import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs';
import { GAS_INPUT_MODES } from '../../../../ducks/send';
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component';

export default class SendGasRow extends Component {
  static propTypes = {
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    updateGasPrice: PropTypes.func,
    updateGasLimit: PropTypes.func,
    gasInputMode: PropTypes.oneOf(Object.values(GAS_INPUT_MODES)),
    resetGasButtons: PropTypes.func,
    gasPrice: PropTypes.string,
    gasLimit: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    minimumGasLimit: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  renderContent() {
    const {
      gasLoadingError,
      gasTotal,
      gasInputMode,
      resetGasButtons,
      updateGasPrice,
      updateGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
      minimumGasLimit,
    } = this.props;
    const gasFeeDisplay = (
      <GasFeeDisplay
        gasLoadingError={gasLoadingError}
        gasTotal={gasTotal}
        onReset={resetGasButtons}
      />
    );
    const advancedGasInputs = (
      <div>
        <AdvancedGasInputs
          updateCustomGasPrice={updateGasPrice}
          updateCustomGasLimit={updateGasLimit}
          customGasPrice={gasPrice}
          customGasLimit={gasLimit}
          insufficientBalance={insufficientBalance}
          minimumGasLimit={minimumGasLimit}
          customPriceIsSafe
          isSpeedUp={false}
        />
      </div>
    );
    // Tests should behave in same way as mainnet, but are using Localhost
    switch (gasInputMode) {
      case GAS_INPUT_MODES.INLINE:
        return advancedGasInputs;
      case GAS_INPUT_MODES.CUSTOM:
      default:
        return gasFeeDisplay;
    }
  }

  render() {
    const { gasFeeError } = this.props;

    return (
      <>
        <SendRowWrapper
          label={`${this.context.t('transactionFee')}:`}
          showError={gasFeeError}
          errorType="gasFee"
        >
          {this.renderContent()}
        </SendRowWrapper>
      </>
    );
  }
}
