import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SendRowWrapper from '../send-row-wrapper';
import AdvancedGasInputs from '../../../../components/app/advanced-gas-inputs';
import { GAS_INPUT_MODES } from '../../../../ducks/send';

export default class SendGasRow extends Component {
  static propTypes = {
    updateGasPrice: PropTypes.func,
    updateGasLimit: PropTypes.func,
    gasInputMode: PropTypes.oneOf(Object.values(GAS_INPUT_MODES)),
    gasPrice: PropTypes.string,
    gasLimit: PropTypes.string,
    insufficientBalance: PropTypes.bool,
    minimumGasLimit: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  render() {
    const {
      updateGasPrice,
      updateGasLimit,
      gasPrice,
      gasLimit,
      insufficientBalance,
      minimumGasLimit,
      gasInputMode,
    } = this.props;

    if (gasInputMode !== GAS_INPUT_MODES.INLINE) {
      return null;
    }

    return (
      <SendRowWrapper>
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
      </SendRowWrapper>
    );
  }
}
