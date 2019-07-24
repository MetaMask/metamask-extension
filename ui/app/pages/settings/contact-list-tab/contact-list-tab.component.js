import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import ContactList from '../../../components/app/contact-list'
import { CONTACT_ADD_ROUTE, CONTACT_VIEW_ROUTE } from '../../../helpers/constants/routes'

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
          addressBook={addressBook}
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
    return <Button
      type="default"
      onClick={() => {
        history.push(CONTACT_ADD_ROUTE)
      }}>
      { this.context.t('add') }
    </Button>
  }

  render () {
    return (
      <div className="address-book-container">
        { this.renderAddresses() }
        { this.renderAddButton() }
      </div>
    )
  }
}
