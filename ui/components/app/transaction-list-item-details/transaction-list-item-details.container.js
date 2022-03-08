import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { tryReverseResolveAddress } from '../../../store/actions';
import {
  getAddressBook,
  getIsCustomNetwork,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import TransactionListItemDetails from './transaction-list-item-details.component';

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state;
  const { ensResolutionsByAddress } = metamask;
  const { recipientAddress, senderAddress } = ownProps;
  let recipientEns;
  if (recipientAddress) {
    const address = toChecksumHexAddress(recipientAddress);
    recipientEns = ensResolutionsByAddress[address] || '';
  }
  const addressBook = getAddressBook(state);

  const getNickName = (address) => {
    const entry = addressBook.find((contact) => {
      return address.toLowerCase() === contact.address.toLowerCase();
    });
    return (entry && entry.name) || '';
  };
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);

  const isCustomNetwork = getIsCustomNetwork(state);

  return {
    rpcPrefs,
    recipientEns,
    senderNickname: getNickName(senderAddress),
    recipientNickname: recipientAddress ? getNickName(recipientAddress) : null,
    isCustomNetwork,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(TransactionListItemDetails);
