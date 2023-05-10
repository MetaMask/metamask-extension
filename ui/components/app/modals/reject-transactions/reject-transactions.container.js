import { connect } from 'react-redux';
import { compose } from 'redux';
import RejectTransactionsModal from './reject-transactions.component';

const mapStateToProps = (_, ownProps) => {
  const { unapprovedTxCount } = ownProps;

  return {
    unapprovedTxCount,
  };
};

export default compose(connect(mapStateToProps))(RejectTransactionsModal);
