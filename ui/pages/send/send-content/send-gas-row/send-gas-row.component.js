import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group';
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs';
import { GAS_INPUT_MODES } from '../../../../ducks/send';
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component';

export default class SendGasRow extends Component {
  static propTypes = {
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    updateGasPrice: PropTypes.func,
    updateGasLimit: PropTypes.func,
    gasInputMode: PropTypes.oneOf(Object.values(GAS_INPUT_MODES)),
    gasPriceButtonGroupProps: PropTypes.object,
    advancedInlineGasShown: PropTypes.bool,
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

  renderAdvancedOptionsButton() {
    const { trackEvent } = this.context;
    const { showCustomizeGasModal } = this.props;
    return (
      <div
        className="advanced-gas-options-btn"
        onClick={() => {
          trackEvent({
            category: 'Transactions',
            event: 'Clicked "Advanced Options"',
          });
          showCustomizeGasModal();
        }}
      >
        {this.context.t('advancedOptions')}
      </div>
    );
  }

  renderContent() {
    const {
      gasLoadingError,
      gasTotal,
      showCustomizeGasModal,
      gasPriceButtonGroupProps,
      gasInputMode,
      resetGasButtons,
      updateGasPrice,
      updateGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
      minimumGasLimit,
    } = this.props;
    const { trackEvent } = this.context;

    const gasPriceButtonGroup = (
      <div>
        <GasPriceButtonGroup
          className="gas-price-button-group--small"
          showCheck={false}
          {...gasPriceButtonGroupProps}
          handleGasPriceSelection={async (opts) => {
            trackEvent({
              category: 'Transactions',
              event: 'User Clicked Gas Estimate Button',
              properties: {
                gasEstimateType: opts.gasEstimateType.toLowerCase(),
              },
            });
            await gasPriceButtonGroupProps.handleGasPriceSelection(opts);
          }}
        />
      </div>
    );
    const gasFeeDisplay = (
      <GasFeeDisplay
        gasLoadingError={gasLoadingError}
        gasTotal={gasTotal}
        onReset={resetGasButtons}
        onClick={showCustomizeGasModal}
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
      case GAS_INPUT_MODES.BASIC:
        return gasPriceButtonGroup;
      case GAS_INPUT_MODES.INLINE:
        return advancedGasInputs;
      case GAS_INPUT_MODES.CUSTOM:
      default:
        return gasFeeDisplay;
    }
  }

  render() {
    const { gasFeeError, gasInputMode, advancedInlineGasShown } = this.props;

    return (
      <>
        <SendRowWrapper
          label={`${this.context.t('transactionFee')}:`}
          showError={gasFeeError}
          errorType="gasFee"
        >
          {this.renderContent()}
        </SendRowWrapper>
        {gasInputMode === GAS_INPUT_MODES.BASIC || advancedInlineGasShown ? (
          <SendRowWrapper>{this.renderAdvancedOptionsButton()}</SendRowWrapper>
        ) : null}
      </>
    );
  }
}
