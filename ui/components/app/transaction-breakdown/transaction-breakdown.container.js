import { connect } from 'react-redux';
import { isHardwareWallet } from '../../../selectors';
import TransactionBreakdown from './transaction-breakdown.component';
import { getTransactionBreakdownData } from './transaction-breakdown-utils';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove } = ownProps;
  const data = getTransactionBreakdownData({
    state,
    transaction,
    isTokenApprove,
    isHardwareWalletAccount: isHardwareWallet(state),
  });
  return data;
};

export default connect(mapStateToProps)(TransactionBreakdown);
