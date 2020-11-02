import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ContactList from '../../../components/app/contact-list'
import {
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
} from '../../../helpers/constants/routes'
import EditContact from './edit-contact'
import AddContact from './add-contact'
import ViewContact from './view-contact'
import MyAccounts from './my-accounts'

export default class ContactListTab extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addressBook: PropTypes.array,
    history: PropTypes.object,
    selectedAddress: PropTypes.string,
    viewingContact: PropTypes.bool,
    editingContact: PropTypes.bool,
    addingContact: PropTypes.bool,
    showContactContent: PropTypes.bool,
    hideAddressBook: PropTypes.bool,
    showingMyAccounts: PropTypes.bool,
  }

  renderAddresses() {
    const { addressBook, history, selectedAddress } = this.props
    const contacts = addressBook.filter(({ name }) => Boolean(name))
    const nonContacts = addressBook.filter(({ name }) => !name)

    return (
      <div>
        <ContactList
          searchForContacts={() => contacts}
          searchForRecents={() => nonContacts}
          selectRecipient={(address) => {
            history.push(`${CONTACT_VIEW_ROUTE}/${address}`)
          }}
          selectedAddress={selectedAddress}
        />
      </div>
    )
  }

  renderAddButton() {
    const { history } = this.props
    return (
      <div
        className="address-book-add-button__button"
        onClick={() => {
          history.push(CONTACT_ADD_ROUTE)
        }}
      >
        <img
          className="account-menu__item-icon"
          src="images/plus-btn-white.svg"
        />
      </div>
    )
  }

  renderMyAccountsButton() {
    const { history } = this.props
    const { t } = this.context
    return (
      <div
        className="address-book__my-accounts-button"
        onClick={() => {
          history.push(CONTACT_MY_ACCOUNTS_ROUTE)
        }}
      >
        <div className="address-book__my-accounts-button__header">
          {t('myWalletAccounts')}
        </div>
        <div className="address-book__my-accounts-button__content">
          <div className="address-book__my-accounts-button__text">
            {t('myWalletAccountsDescription')}
          </div>
          <div className="address-book__my-accounts-button__caret" />
        </div>
      </div>
    )
  }

  renderContactContent() {
    const {
      viewingContact,
      editingContact,
      addingContact,
      showContactContent,
    } = this.props

    if (!showContactContent) {
      return null
    }

    let ContactContentComponent = null
    if (viewingContact) {
      ContactContentComponent = ViewContact
    } else if (editingContact) {
      ContactContentComponent = EditContact
    } else if (addingContact) {
      ContactContentComponent = AddContact
    }

    return (
      ContactContentComponent && (
        <div className="address-book-contact-content">
          <ContactContentComponent />
        </div>
      )
    )
  }

  renderAddressBookContent() {
    const { hideAddressBook, showingMyAccounts } = this.props

    if (!hideAddressBook && !showingMyAccounts) {
      return (
        <div className="address-book">
          {this.renderMyAccountsButton()}
          {this.renderAddresses()}
        </div>
      )
    } else if (!hideAddressBook && showingMyAccounts) {
      return <MyAccounts />
    }
    return null
  }

  render() {
    const { addingContact } = this.props

    return (
      <div className="address-book-wrapper">
        {this.renderAddressBookContent()}
        {this.renderContactContent()}
        {!addingContact && (
          <div className="address-book-add-button">
            {this.renderAddButton()}
          </div>
        )}
      </div>
    )
  }
}
