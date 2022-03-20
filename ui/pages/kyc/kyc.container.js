import { connect } from 'react-redux';
import {
  // accountsWithSendEtherInfoSelector,
  // getAddressBookEntry,
  // getIsEthGasPriceFetched,
  // getNoGasPriceFetched,
  getSelectedAddress,
  // checkNetworkOrAccountNotSupports1559,
} from '../../selectors';
// import {
//   getIsBalanceInsufficient,
//   getSendTo,
//   getSendAsset,
//   getAssetError,
// } from '../../ducks/send';

import { getSendToAccounts } from '../../ducks/metamask/metamask';
import KycComponent from './kyc.component';

function mapStateToProps(state) {
  // const ownedAccounts = accountsWithSendEtherInfoSelector(state);
  // const to = getSendTo(state);
  const currentAddress = getSelectedAddress(state);
  return {
    // toAccounts: getSendToAccounts(state),
    currentAddress,
    // isOwnedAccount: Boolean(
    //   ownedAccounts.find(
    //     ({ address }) => address.toLowerCase() === to.toLowerCase(),
    //   ),
    // ),
    // contact: getAddressBookEntry(state, to),
    // isEthGasPrice: getIsEthGasPriceFetched(state),
    // noGasPrice: getNoGasPriceFetched(state),
    // to,
    // networkOrAccountNotSupports1559: checkNetworkOrAccountNotSupports1559(
    //   state,
    // ),
    // getIsBalanceInsufficient: getIsBalanceInsufficient(state),
    // asset: getSendAsset(state),
    // assetError: getAssetError(state),
  };
}

export default connect(mapStateToProps)(KycComponent);
