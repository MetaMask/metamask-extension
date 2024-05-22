import { connect } from 'react-redux';
import { getShouldShowFiat } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';
import { isEIP1559Transaction } from '../../../../shared/modules/transaction.utils';

import {
  subtractHexes,
  sumHexes,
} from '../../../../shared/modules/conversion.utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { CONFIRMED_STATUS } from '../transaction-activity-log/transaction-activity-log.constants';
import TransactionBreakdown from './transaction-breakdown.component';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove } = ownProps;
  const {
    txParams: { gas, gasPrice, maxFeePerGas, value } = {},
    txReceipt: { gasUsed, effectiveGasPrice, l1Fee: l1HexGasTotal } = {},
    baseFeePerGas,
    sourceTokenAmount,
    sourceTokenDecimals,
    sourceTokenSymbol,
    destinationTokenAmount,
    destinationTokenDecimals,
    destinationTokenSymbol,
    status,
  } = transaction;

  const sourceAmountFormatted =
    sourceTokenAmount && sourceTokenDecimals && sourceTokenSymbol
      ? `${calcTokenAmount(
          sourceTokenAmount,
          sourceTokenDecimals,
        )} ${sourceTokenSymbol}`
      : undefined;
  const destinationAmountFormatted =
    destinationTokenAmount &&
    destinationTokenDecimals &&
    destinationTokenSymbol &&
    status === CONFIRMED_STATUS
      ? `${calcTokenAmount(
          destinationTokenAmount,
          destinationTokenDecimals,
        )} ${destinationTokenSymbol}`
      : undefined;

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

  const totalInHex = sumHexes(hexGasTotal, value, l1HexGasTotal ?? 0);

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
    l1HexGasTotal,
    sourceAmountFormatted,
    destinationAmountFormatted,
  };
};

export default connect(mapStateToProps)(TransactionBreakdown);
