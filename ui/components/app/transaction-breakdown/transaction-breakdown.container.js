import { connect } from 'react-redux';
import TransactionBreakdown from './transaction-breakdown.component';
import { getTransactionBreakdownData } from './transaction-breakdown-utils';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove, isHardwareWalletAccount } = ownProps;
  const data = getTransactionBreakdownData({
    state,
    transaction,
    isTokenApprove,
    isHardwareWalletAccount,
  });
  return data;
};

export default connect(mapStateToProps)(TransactionBreakdown);
