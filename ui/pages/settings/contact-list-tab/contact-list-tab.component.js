import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ContactList from '../../../components/app/contact-list';
import {
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import Button from '../../../components/ui/button';
import {
  getNumberOfSettingsInSection,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import EditContact from './edit-contact';
import AddContact from './add-contact';
import ViewContact from './view-contact';

export default class ContactListTab extends Component {
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

  settingsRefs = Array(
    getNumberOfSettingsInSection(this.context.t, this.context.t('contacts')),
  )
    .fill(undefined)
    .map(() => {
      return React.createRef();
    });

  componentDidUpdate() {
    const { t } = this.context;
    handleSettingsRefs(t, t('contacts'), this.settingsRefs);
  }

  componentDidMount() {
    const { t } = this.context;
    handleSettingsRefs(t, t('contacts'), this.settingsRefs);
  }

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
          <i
            className="fa fa-address-book fa-4x address-book__icon"
            title={t('addressBookIcon')}
          />
          <h4 className="address-book__title">{t('buildContactList')}</h4>
          <p className="address-book__sub-title">
            {t('addFriendsAndAddresses')}
          </p>
          <button
            className="address-book__link"
            onClick={() => {
              history.push(CONTACT_ADD_ROUTE);
            }}
          >
            + {t('addContact')}
          </button>
        </div>
      </div>
    );
  }

  renderAddButton() {
    const { history, viewingContact, editingContact } = this.props;

    return (
      <div className="address-book-add-button">
        <Button
          className={classnames({
            'address-book-add-button__button': true,
            'address-book-add-button__button--hidden':
              viewingContact || editingContact,
          })}
          type="secondary"
          onClick={() => {
            history.push(CONTACT_ADD_ROUTE);
          }}
        >
          {this.context.t('addContact')}
        </Button>
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
        <div ref={this.settingsRefs[0]} className="address-book">
          {this.renderAddresses()}
        </div>
      );
    }
    return null;
  }

  render() {
    const { addingContact, addressBook } = this.props;

    return (
      <div className="address-book-wrapper">
        {this.renderAddressBookContent()}
        {this.renderContactContent()}
        {!addingContact && addressBook.length > 0
          ? this.renderAddButton()
          : null}
      </div>
    );
  }
}
