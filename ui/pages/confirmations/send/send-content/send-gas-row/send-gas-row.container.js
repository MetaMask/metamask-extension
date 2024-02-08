import { connect } from 'react-redux';
import {
  getGasPrice,
  getGasLimit,
  gasFeeIsInError,
  getGasInputMode,
  updateGasPrice,
  updateGasLimit,
  isSendStateInitialized,
  getIsBalanceInsufficient,
  getMinimumGasLimitForSend,
} from '../../../../../ducks/send';
import {
  setCustomGasPrice,
  setCustomGasLimit,
} from '../../../../../ducks/gas/gas.duck';
import { hexToDecimal } from '../../../../../../shared/modules/conversion.utils';
import SendGasRow from './send-gas-row.component';

export default connect(mapStateToProps, mapDispatchToProps)(SendGasRow);

function mapStateToProps(state) {
  const gasPrice = getGasPrice(state);
  const gasLimit = getGasLimit(state);

  const minimumGasLimit = getMinimumGasLimitForSend(state);

  return {
    minimumGasLimit: hexToDecimal(minimumGasLimit),
    gasFeeError: gasFeeIsInError(state),
    gasLoadingError: isSendStateInitialized(state),
    gasInputMode: getGasInputMode(state),
    gasPrice,
    gasLimit,
    insufficientBalance: getIsBalanceInsufficient(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateGasPrice: (gasPrice) => {
      dispatch(updateGasPrice(gasPrice));
      dispatch(setCustomGasPrice(gasPrice));
    },
    updateGasLimit: (newLimit) => {
      dispatch(updateGasLimit(newLimit));
      dispatch(setCustomGasLimit(newLimit));
    },
  };
}
