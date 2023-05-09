import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getAddressBook } from '../../../selectors';

import {
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import {
  clearContactList,
  exportContactList,
  importContactList,
} from '../../../store/actions';
import ContactListTab from './contact-list-tab.component';

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname } = location;

  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const pathNameTailIsAddress = pathNameTail.includes('0x');

  const viewingContact = Boolean(pathname.match(CONTACT_VIEW_ROUTE));
  const editingContact = Boolean(pathname.match(CONTACT_EDIT_ROUTE));
  const addingContact = Boolean(pathname.match(CONTACT_ADD_ROUTE));
  const envIsPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const hideAddressBook =
    envIsPopup && (viewingContact || editingContact || addingContact);

  return {
    viewingContact,
    editingContact,
    addingContact,
    addressBook: getAddressBook(state),
    selectedAddress: pathNameTailIsAddress ? pathNameTail : '',
    hideAddressBook,
    envIsPopup,
    showContactContent: !envIsPopup || hideAddressBook,
  };
};

export const mapDispatchToProps = () => {
  return {
    importContactList: (json) => {
      return importContactList(json);
    },
    exportContactList: () => exportContactList(),
    clearContactList: () => clearContactList(),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ContactListTab);
