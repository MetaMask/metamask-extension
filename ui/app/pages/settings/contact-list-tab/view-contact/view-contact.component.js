import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import { CONTACT_LIST_ROUTE, CONTACT_EDIT_ROUTE } from '../../../../helpers/constants/routes'
import { addressSlicer } from '../../../../helpers/utils/util'
import Button from "../../../../components/ui/button/button.component";
const copyToClipboard = require('copy-to-clipboard')

export default class ViewContact extends PureComponent {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addressBook: PropTypes.object,
    addToAddressBook: PropTypes.func,
    removeFromAddressBook: PropTypes.func,
    history: PropTypes.object,
    match: PropTypes.object,
  }

   render () {
    const { t } = this.context
    const { removeFromAddressBook, history, match, addressBook } = this.props
    const address = match.params.id
    const currentEntry = addressBook.filter(contact => contact.address === address)[0] || {}
    const name = currentEntry.name !== '' ? currentEntry.name : addressSlicer(address)

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <div className="settings-page__header address-book__header">
            <Identicon address={address} diameter={60} />
            <div className="settings-page__button-group">
            <Button
              type="link"
              className="settings-page__address-book-button"
              onClick={() => {
                history.push(`${CONTACT_EDIT_ROUTE}/${address}`)
              }}
            >
              {t('edit')}
            </Button>
            <Button
              type="link"
              className="settings-page__address-book-button"
              onClick={() => {
                removeFromAddressBook(address)
                history.push(CONTACT_LIST_ROUTE)
              }}
            >
              {t('remove')}
            </Button>
            </div>
          </div>
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('userName') }
            </div>
            <div className="address-book__view-contact__group__value">
              { name }
            </div>
          </div>
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('ethereumPublicAddress') }
            </div>
            <div className="address-book__view-contact__group__value">
              <div
                className="address-book__view-contact__group__value--address"
                onClick={() => copyToClipboard(address)}
              >
                { `${address.slice(0, 2)} ${address.slice(2).match(/.{1,4}/g).join(' ')}`}
              </div>
              <img
                className="address-book__view-contact__group__value--copy-icon"
                src="/images/copy-to-clipboard.svg"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
