import { connect } from 'react-redux';
import {
  getShouldShowFiat,
  getIsMultiLayerFeeNetwork,
} from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';
import { isEIP1559Transaction } from '../../../../shared/modules/transaction.utils';

import {
  subtractHexes,
  sumHexes,
} from '../../../../shared/modules/conversion.utils';
import TransactionBreakdown from './transaction-breakdown.component';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove } = ownProps;
  const {
    txParams: { gas, gasPrice, maxFeePerGas, value } = {},
    txReceipt: { gasUsed, effectiveGasPrice, l1Fee: l1HexGasTotal } = {},
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

  let totalInHex = sumHexes(hexGasTotal, value);

  const isMultiLayerFeeNetwork =
    getIsMultiLayerFeeNetwork(state) && l1HexGasTotal !== undefined;

  if (isMultiLayerFeeNetwork) {
    totalInHex = sumHexes(totalInHex, l1HexGasTotal);
  }

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: getShouldShowFiat(state),
    totalInHex,
    gas,
    gasPrice,
    maxFeePerGas,
    gasUsed,
    isTokenApprove,
    hexGasTotal,
    priorityFee,
    baseFee: baseFeePerGas,
    isEIP1559Transaction: isEIP1559Transaction(transaction),
    isMultiLayerFeeNetwork,
    l1HexGasTotal,
  };
};

export default connect(mapStateToProps)(TransactionBreakdown);
