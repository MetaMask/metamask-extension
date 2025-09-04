import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  getAddressBook,
  getAddressBookEntry,
  getInternalAccountByAddress,
  getInternalAccounts,
} from '../../../../selectors';
import {
  getNetworkConfigurationsByChainId,
  getProviderConfig,
} from '../../../../../shared/modules/selectors/networks';
import {
  CONTACT_VIEW_ROUTE,
  CONTACT_LIST_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  addToAddressBook,
  removeFromAddressBook,
  toggleNetworkMenu,
} from '../../../../store/actions';
import EditContact from './edit-contact.component';

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname } = location;
  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const pathNameTailIsAddress = pathNameTail.includes('0x');
  const address = pathNameTailIsAddress
    ? pathNameTail.toLowerCase()
    : ownProps.match.params.id;

  const contact = getAddressBookEntry(state, address);
  const networkConfigurations = getNetworkConfigurationsByChainId(state);
  const { memo } = contact || {};
  const name =
    contact?.name || getInternalAccountByAddress(state, address)?.metadata?.name || '';

  const { chainId } = getProviderConfig(state);
  const contactChainId = contact?.chainId || chainId;

  return {
    address: contact ? address : null,
    addressBook: getAddressBook(state),
    internalAccounts: getInternalAccounts(state),
    contactChainId,
    name,
    memo,
    networkConfigurations,
    viewRoute: CONTACT_VIEW_ROUTE,
    listRoute: CONTACT_LIST_ROUTE,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addToAddressBook: (recipient, nickname, memo, customChainId) =>
      dispatch(addToAddressBook(recipient, nickname, memo, customChainId)),
    removeFromAddressBook: (chainId, addressToRemove) =>
      dispatch(removeFromAddressBook(chainId, addressToRemove)),
    toggleNetworkMenu: () => dispatch(toggleNetworkMenu()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(EditContact);
