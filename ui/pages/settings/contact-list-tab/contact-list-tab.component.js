import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContactList from '../../../components/app/contact-list';
import { CONTACT_VIEW_ROUTE } from '../../../helpers/constants/routes';
import AddNewContactModal from '../../../components/app/modals/add-new-contact-modal/add-new-contact-modal.component';
import EditContact from './edit-contact';
import AddContact from './add-contact';
import ViewContact from './view-contact';

export default class ContactListTab extends Component {
  constructor() {
    super();
    this.state = { isAddNewContactModalOpen: false };
    this.setIsAddNewContactModalOpen = this.setIsAddNewContactModalOpen.bind(
      this,
    );
  }

  setIsAddNewContactModalOpen(isOpen) {
    this.setState({
      isAddNewContactModalOpen: isOpen,
    });
  }

  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    addressBook: PropTypes.array,
    history: PropTypes.object,
    selectedAddress: PropTypes.string,
    viewingContact: PropTypes.bool,
    editingContact: PropTypes.bool,
    addingContact: PropTypes.bool,
    showContactContent: PropTypes.bool,
    hideAddressBook: PropTypes.bool,
  };

  renderAddresses() {
    const { addressBook, history, selectedAddress } = this.props;
    const contacts = addressBook.filter(({ name }) => Boolean(name));
    const nonContacts = addressBook.filter(({ name }) => !name);
    const { t } = this.context;

    if (addressBook.length) {
      return (
        <div>
          <ContactList
            searchForContacts={() => contacts}
            searchForRecents={() => nonContacts}
            selectRecipient={(address) => {
              history.push(`${CONTACT_VIEW_ROUTE}/${address}`);
            }}
            selectedAddress={selectedAddress}
          />
        </div>
      );
    }
    return (
      <div className="address-book__container">
        <div>
          <img src="./images/address-book.svg" alt={t('addressBookIcon')} />
          <h4 className="address-book__title">{t('buildContactList')}</h4>
          <p className="address-book__sub-title">
            {t('addFriendsAndAddresses')}
          </p>
          <button
            className="address-book__link"
            onClick={(e) => {
              e.preventDefault();
              this.setIsAddNewContactModalOpen(true);
            }}
          >
            + {t('addContact')}
          </button>
        </div>
      </div>
    );
  }

  renderContactContent() {
    const {
      viewingContact,
      editingContact,
      addingContact,
      showContactContent,
    } = this.props;

    if (!showContactContent) {
      return null;
    }

    let ContactContentComponent = null;
    if (viewingContact) {
      ContactContentComponent = ViewContact;
    } else if (editingContact) {
      ContactContentComponent = EditContact;
    } else if (addingContact) {
      ContactContentComponent = AddContact;
    }

    return (
      ContactContentComponent && (
        <div className="address-book-contact-content">
          <ContactContentComponent />
        </div>
      )
    );
  }

  renderAddressBookContent() {
    const { hideAddressBook } = this.props;

    if (!hideAddressBook) {
      return (
        <>
          {this.state.isAddNewContactModalOpen ? (
            <AddNewContactModal
              setIsAddNewContactModalOpen={this.setIsAddNewContactModalOpen}
            />
          ) : (
            <div className="address-book">{this.renderAddresses()}</div>
          )}
        </>
      );
    }
    return null;
  }

  render() {
    return (
      <div className="address-book-wrapper">
        {this.renderAddressBookContent()}
        {this.renderContactContent()}
        <div className="address-book-add-button">
          <button
            className="address-book-add-button__button button btn-secondary btn--rounded"
            onClick={(e) => {
              e.preventDefault();
              this.setIsAddNewContactModalOpen(true);
            }}
          >
            {this.context.t('addContact')}
          </button>
        </div>
      </div>
    );
  }
}
