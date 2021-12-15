import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  getAddressBookEntry,
  getIsEthGasPriceFetched,
  getNoGasPriceFetched,
  checkNetworkOrAccountNotSupports1559,
  getTokenList,
} from '../../../selectors';
import {
  getIsBalanceInsufficient,
  getSendTo,
  getSendAsset,
  getAssetError,
  getRecipient,
} from '../../../ducks/send';

import SendContent from './send-content.component';

function mapStateToProps(state) {
  const ownedAccounts = accountsWithSendEtherInfoSelector(state);
  const to = getSendTo(state);
  const recipient = getRecipient(state);
  const tokenAddressList = getTokenList(state);
  return {
    isOwnedAccount: Boolean(
      ownedAccounts.find(
        ({ address }) => address.toLowerCase() === to.toLowerCase(),
      ),
    ),
    contact: getAddressBookEntry(state, to),
    isEthGasPrice: getIsEthGasPriceFetched(state),
    noGasPrice: getNoGasPriceFetched(state),
    to,
    networkOrAccountNotSupports1559: checkNetworkOrAccountNotSupports1559(
      state,
    ),
    getIsBalanceInsufficient: getIsBalanceInsufficient(state),
    asset: getSendAsset(state),
    assetError: getAssetError(state),
    recipient,
    tokenAddressList,
  };
}

export default connect(mapStateToProps)(SendContent);
