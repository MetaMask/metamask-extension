import { connect } from 'react-redux';
import { compose } from 'redux';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { type TransactionMeta } from '@metamask/transaction-controller';
import { type NetworkClientConfiguration } from '@metamask/network-controller';

import {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../../store/store';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { hideModal } from '../../../../store/actions';
import { getRpcPrefsForCurrentProvider } from '../../../../selectors';
import TransactionAlreadyConfirmed from './transaction-already-confirmed.component';

function mapDispatchToProps(dispatch: MetaMaskReduxDispatch) {
  return {
    viewTransaction: (
      transaction: TransactionMeta,
      rpcPrefs: NetworkClientConfiguration,
    ) => {
      const blockExplorerLink = getBlockExplorerLink(
        transaction as any,
        rpcPrefs as any,
      );
      global.platform.openTab({
        url: blockExplorerLink,
      });
      dispatch(hideModal());
    },
  };
}

function mapStateToProps(state: MetaMaskReduxState, ownProps: any) {
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
