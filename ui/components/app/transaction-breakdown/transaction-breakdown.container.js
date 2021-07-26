import { connect } from 'react-redux';
import { getShouldShowFiat } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
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

  const usedGasPrice = gasPrice || effectiveGasPrice;
  const hexGasTotal =
    (gasLimit &&
      usedGasPrice &&
      getHexGasTotal({ gasLimit, gasPrice: usedGasPrice })) ||
    '0x0';
  const totalInHex = sumHexes(hexGasTotal, value);

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
  };
};

export default connect(mapStateToProps)(TransactionBreakdown);
