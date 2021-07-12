import { connect } from 'react-redux';
import { getShouldShowFiat } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';
import { sumHexes } from '../../../helpers/utils/transactions.util';
import TransactionBreakdown from './transaction-breakdown.component';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove } = ownProps;
  const {
    txParams: { gas, gasPrice, value } = {},
    txReceipt: { gasUsed } = {},
  } = transaction;

  const gasLimit = typeof gasUsed === 'string' ? gasUsed : gas;

  const hexGasTotal =
    (gasLimit && gasPrice && getHexGasTotal({ gasLimit, gasPrice })) || '0x0';
  const totalInHex = sumHexes(hexGasTotal, value);

  return {
    nativeCurrency: getNativeCurrency(state),
    showFiat: getShouldShowFiat(state),
    totalInHex,
    gas,
    gasPrice,
    gasUsed,
    isTokenApprove,
  };
};

export default connect(mapStateToProps)(TransactionBreakdown);
