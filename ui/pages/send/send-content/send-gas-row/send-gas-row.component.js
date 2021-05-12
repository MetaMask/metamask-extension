import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group';
import AdvancedGasInputs from '../../../../components/app/gas-customization/advanced-gas-inputs';
import GasFeeDisplay from './gas-fee-display/gas-fee-display.component';

export default class SendGasRow extends Component {
  static propTypes = {
    gasFeeError: PropTypes.bool,
    gasLoadingError: PropTypes.bool,
    gasTotal: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    updateGasPrice: PropTypes.func,
    updateGasLimit: PropTypes.func,
    gasPriceButtonGroupProps: PropTypes.object,
    gasButtonGroupShown: PropTypes.bool,
    advancedInlineGasShown: PropTypes.bool,
    resetGasButtons: PropTypes.func,
    gasPrice: PropTypes.string,
    gasLimit: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    isMainnet: PropTypes.bool,
    isEthGasPrice: PropTypes.bool,
    noGasPrice: PropTypes.bool,
    minimumGasLimit: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  renderAdvancedOptionsButton() {
    const { metricsEvent } = this.context;
    const {
      showCustomizeGasModal,
      isMainnet,
      isEthGasPrice,
      noGasPrice,
    } = this.props;
    // Tests should behave in same way as mainnet, but are using Localhost
    if (!isMainnet && !process.env.IN_TEST) {
      return null;
    }
    if (isEthGasPrice || noGasPrice) {
      return null;
    }
    return (
      <div
        className="advanced-gas-options-btn"
        onClick={() => {
          metricsEvent({
            eventOpts: {
              category: 'Transactions',
              action: 'Edit Screen',
              name: 'Clicked "Advanced Options"',
            },
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
      gasButtonGroupShown,
      advancedInlineGasShown,
      resetGasButtons,
      updateGasPrice,
      updateGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
      isMainnet,
      isEthGasPrice,
      minimumGasLimit,
      noGasPrice,
    } = this.props;
    const { metricsEvent } = this.context;
    const gasPriceFetchFailure = isEthGasPrice || noGasPrice;

    const gasPriceButtonGroup = (
      <div>
        <GasPriceButtonGroup
          className="gas-price-button-group--small"
          showCheck={false}
          {...gasPriceButtonGroupProps}
          handleGasPriceSelection={async (opts) => {
            metricsEvent({
              eventOpts: {
                category: 'Transactions',
                action: 'Edit Screen',
                name: 'Changed Gas Button',
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
    if (
      advancedInlineGasShown ||
      (!isMainnet && !process.env.IN_TEST) ||
      gasPriceFetchFailure
    ) {
      return advancedGasInputs;
    } else if (gasButtonGroupShown) {
      return gasPriceButtonGroup;
    }
    return gasFeeDisplay;
  }

  render() {
    const {
      gasFeeError,
      gasButtonGroupShown,
      advancedInlineGasShown,
    } = this.props;

    return (
      <>
        <SendRowWrapper
          label={`${this.context.t('transactionFee')}:`}
          showError={gasFeeError}
          errorType="gasFee"
        >
          {this.renderContent()}
        </SendRowWrapper>
        {gasButtonGroupShown || advancedInlineGasShown ? (
          <SendRowWrapper>{this.renderAdvancedOptionsButton()}</SendRowWrapper>
        ) : null}
      </>
    );
  }
}
