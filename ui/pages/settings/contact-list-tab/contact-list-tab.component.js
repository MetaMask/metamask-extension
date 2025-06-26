import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ContactList from '../../../components/app/contact-list';
import {
  CONTACT_ADD_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_VIEW_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getNumberOfSettingRoutesInTab,
  handleSettingsRefs,
} from '../../../helpers/utils/settings-search';
import {
  ButtonPrimary,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { IconColor, Size } from '../../../helpers/constants/design-system';
import EditContact from './edit-contact';
import AddContact from './add-contact';
import ViewContact from './view-contact';

export default class ContactListTab extends Component {
  static contextTypes = {
    t: PropTypes.func,
  };

  static propTypes = {
    completeAddressBook: PropTypes.array,
    internalAccounts: PropTypes.array,
    history: PropTypes.object,
    selectedAddress: PropTypes.string,
    viewingContact: PropTypes.bool,
    editingContact: PropTypes.bool,
    addingContact: PropTypes.bool,
    hideAddressBook: PropTypes.bool,
    currentPath: PropTypes.string,
  };

  settingsRefs = Array(
    getNumberOfSettingRoutesInTab(this.context.t, this.context.t('contacts')),
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
    const { completeAddressBook, internalAccounts, history, selectedAddress } =
      this.props;

    const updatedAddressBook = Object.entries(completeAddressBook).map(
      ([_, value]) => value,
    );

    const contacts = updatedAddressBook.filter(({ name }) => Boolean(name));
    const nonContacts = updatedAddressBook.filter(({ name }) => !name);

    const { t } = this.context;

    if (updatedAddressBook.length) {
      return (
        <div>
          <ContactList
            addressBook={updatedAddressBook}
            internalAccounts={internalAccounts}
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
          <Icon
            name={IconName.Book}
            color={IconColor.iconMuted}
            className="address-book__icon"
            size={IconSize.Xl}
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
      <ButtonPrimary
        className={classnames('address-book-add-button__button', {
          'address-book-add-button__button--hidden':
            viewingContact || editingContact,
        })}
        onClick={() => {
          history.push(CONTACT_ADD_ROUTE);
        }}
        margin={4}
        size={Size.LG}
      >
        {this.context.t('addContact')}
      </ButtonPrimary>
    );
  }

  renderContactContent() {
    const { viewingContact, editingContact, addingContact } = this.props;

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
    const { addingContact, currentPath, completeAddressBook } = this.props;

    const addressData = completeAddressBook;
    return (
      <div className="address-book-wrapper">
        {this.renderAddressBookContent()}
        {this.renderContactContent()}
        {currentPath === CONTACT_LIST_ROUTE &&
        !addingContact &&
        addressData.length > 0
          ? this.renderAddButton()
          : null}
      </div>
    );
  }
}
