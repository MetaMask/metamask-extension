import { connect } from 'react-redux';
import { compose } from 'redux';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { hideModal } from '../../../../store/actions';
import { getRpcPrefsForCurrentProvider } from '../../../../selectors';

import TransactionAlreadyConfirmed from './transaction-already-confirmed.component';

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => dispatch(hideModal()),
    viewTransaction: (transaction, rpcPrefs) => {
      const blockExplorerLink = getBlockExplorerLink(transaction, rpcPrefs);
      global.platform.openTab({
        url: blockExplorerLink,
      });
      dispatch(hideModal());
    },
  };
}

function mapStateToProps(state, ownProps) {
  const transactionId = ownProps.originalTransactionId;
  return {
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    transaction: state.metamask.transactions.find(
      ({ id }) => id === transactionId,
    ),
  };
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(TransactionAlreadyConfirmed);
