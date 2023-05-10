import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import {
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import withModalProps from '../../../helpers/higher-order-components/with-modal-props/with-modal-props';
import { getAddressBook } from '../../../selectors';
import {
  exportContactList,
  importContactList,
  showModal,
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

export const mapDispatchToProps = (dispatch) => {
  return {
    importContactList: (json, fileName) => importContactList(json, fileName),
    exportContactList: () => exportContactList(),
    showClearContactListModal: () =>
      dispatch(showModal({ name: 'CONFIRM_CLEAR_CONTACT_LIST' })),
  };
};

export default compose(
  withRouter,
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ContactListTab);
