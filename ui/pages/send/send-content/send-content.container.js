import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  getAddressBookEntry,
  getIsEthGasPriceFetched,
  getNoGasPriceFetched,
  checkNetworkAndAccountSupports1559,
} from '../../../selectors';
import { getIsAssetSendable, getSendTo } from '../../../ducks/send';

import * as actions from '../../../store/actions';
import SendContent from './send-content.component';

function mapStateToProps(state) {
  const ownedAccounts = accountsWithSendEtherInfoSelector(state);
  const to = getSendTo(state);
  return {
    isAssetSendable: getIsAssetSendable(state),
    isOwnedAccount: Boolean(
      ownedAccounts.find(
        ({ address }) => address.toLowerCase() === to.toLowerCase(),
      ),
    ),
    contact: getAddressBookEntry(state, to),
    isEthGasPrice: getIsEthGasPriceFetched(state),
    noGasPrice: getNoGasPriceFetched(state),
    to,
    networkAndAccountSupports1559: checkNetworkAndAccountSupports1559(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showAddToAddressBookModal: (recipient) =>
      dispatch(
        actions.showModal({
          name: 'ADD_TO_ADDRESSBOOK',
          recipient,
        }),
      ),
  };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { to, ...restStateProps } = stateProps;
  return {
    ...ownProps,
    ...restStateProps,
    showAddToAddressBookModal: () =>
      dispatchProps.showAddToAddressBookModal(to),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SendContent);
