import { connect } from 'react-redux';
import TransactionBreakdown from './transaction-breakdown.component';
import { getTransactionBreakdownData } from './transaction-breakdown-utils';

const mapStateToProps = (state, ownProps) => {
  const { transaction, isTokenApprove } = ownProps;
  const data = getTransactionBreakdownData({
    state,
    transaction,
    isTokenApprove,
  });
  return data;
};

export default connect(mapStateToProps)(TransactionBreakdown);
