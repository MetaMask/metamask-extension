import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';

import {
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import { getAddressBook, getInternalAccounts } from '../../../selectors';
import ContactListTab from './contact-list-tab.component';

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname } = location;

  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const pathNameTailIsAddress = pathNameTail.includes('0x');

  const viewingContact = Boolean(pathname.match(CONTACT_VIEW_ROUTE));
  const editingContact = Boolean(pathname.match(CONTACT_EDIT_ROUTE));
  const addingContact = Boolean(pathname.match(CONTACT_ADD_ROUTE));

  const hideAddressBook = viewingContact || editingContact || addingContact;

  return {
    viewingContact,
    editingContact,
    addingContact,
    addressBook: getAddressBook(state),
    internalAccounts: getInternalAccounts(state),
    selectedAddress: pathNameTailIsAddress ? pathNameTail : '',
    hideAddressBook,
    currentPath: pathname,
  };
};

export default compose(withRouter, connect(mapStateToProps))(ContactListTab);
