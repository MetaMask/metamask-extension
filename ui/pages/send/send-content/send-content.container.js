import { connect } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  getAddressBookEntry,
  getIsEthGasPriceFetched,
  getNoGasPriceFetched,
  checkNetworkOrAccountNotSupports1559,
} from '../../../selectors';
import {
  getIsBalanceInsufficient,
  getSendTo,
  getSendAsset,
  getAssetError,
  getRecipient,
  acknowledgeRecipientWarning,
  getRecipientWarningAcknowledgement,
} from '../../../ducks/send';

import SendContent from './send-content.component';

function mapStateToProps(state) {
  const ownedAccounts = accountsWithSendEtherInfoSelector(state);
  const to = getSendTo(state);
  const recipient = getRecipient(state);
  const recipientWarningAcknowledged = getRecipientWarningAcknowledgement(
    state,
  );
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
    recipientWarningAcknowledged,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    acknowledgeRecipientWarning: () => dispatch(acknowledgeRecipientWarning()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendContent);
