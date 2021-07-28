import { connect } from 'react-redux';
import { getShouldShowFiat } from '../../../selectors';
import {
  getNativeCurrency,
  isEIP1559Network,
} from '../../../ducks/metamask/metamask';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';
import { subtractHexes } from '../../../helpers/utils/conversions.util';
import { sumHexes } from '../../../helpers/utils/transactions.util';
import TransactionBreakdown from './transaction-breakdown.component';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove } = ownProps;
  const {
    txParams: { gas, gasPrice, value } = {},
    txReceipt: { gasUsed, effectiveGasPrice } = {},
    baseFeePerGas,
  } = transaction;

  const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas;

  const priorityFee =
    effectiveGasPrice &&
    baseFeePerGas &&
    subtractHexes(effectiveGasPrice, baseFeePerGas);

  // To calculate the total cost of the transaction, we use gasPrice if it is in the txParam,
  // which will only be the case on non-EIP1559 networks. If it is not in the params, we can
  // use the effectiveGasPrice from the receipt, which will ultimately represent to true cost
  // of the transaction. Either of these are used the same way with gasLimit to calculate total
  // cost. effectiveGasPrice will be available on the txReciept for all EIP1559 networks
  const usedGasPrice = gasPrice || effectiveGasPrice;
  const hexGasTotal =
    (gasLimit &&
      usedGasPrice &&
      getHexGasTotal({ gasLimit, gasPrice: usedGasPrice })) ||
    '0x0';
  const totalInHex = sumHexes(hexGasTotal, value);

  const supportsEIP1559 = isEIP1559Network(state);

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: getShouldShowFiat(state),
    totalInHex,
    gas,
    gasPrice,
    gasUsed,
    isTokenApprove,
    effectiveGasPrice,
    hexGasTotal,
    priorityFee,
    baseFee: baseFeePerGas,
    supportsEIP1559,
  };
};

export default connect(mapStateToProps)(TransactionBreakdown);
