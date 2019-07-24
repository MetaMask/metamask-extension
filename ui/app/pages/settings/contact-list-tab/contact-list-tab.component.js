import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import ContactList from '../../../components/app/contact-list'
import {
  CONTACT_ADD_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
} from '../../../helpers/constants/routes'

export default class ContactListTab extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addressBook: PropTypes.array,
    history: PropTypes.object,
  }

  renderAddresses () {
    const { addressBook, history } = this.props
    const contacts = addressBook.filter(({ name }) => !!name)
    const nonContacts = addressBook.filter(({ name }) => !name)

    return (
      <div>
        <ContactList
          searchForContacts={() => contacts}
          searchForRecents={() => nonContacts}
          selectRecipient={(address) => {
            history.push(`${CONTACT_VIEW_ROUTE}/${address}`)
          }}
        />
      </div>
    )
  }

  renderAddButton () {
    const { history } = this.props
    return <div
      className="address-book-add-button__button"
      onClick={() => {
        history.push(CONTACT_ADD_ROUTE)
      }}>
      <img
        className="account-menu__item-icon"
        src="images/plus-btn-white.svg"
      />
    </div>
  }

  renderMyAccounts () {
    const { history } = this.props
    const { t } = this.context
    return (
      <div
        className="address-book__my-accounts-button"
        onClick={() => {
          history.push(CONTACT_MY_ACCOUNTS_ROUTE)
        }}
      >
        <div className="address-book__my-accounts-button__header">{t('myWalletAccounts')}</div>
        <div className="address-book__my-accounts-button__content">
          <div className="address-book__my-accounts-button__text">
            { t('myWalletAccountsDescription') }
          </div>
          <div className="address-book__my-accounts-button__caret" />
        </div>
      </div>
    )
  }

  render () {
    return (
      <div>
        <div className="address-book">
          { this.renderMyAccounts() }
          { this.renderAddresses() }
        </div>
        <div className="address-book-add-button">
          { this.renderAddButton() }
        </div>
      </div>
    )
  }
}
