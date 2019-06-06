import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import { CONTACT_LIST_ROUTE, CONTACT_EDIT_ROUTE } from '../../../../helpers/constants/routes'
import { addressSlicer } from '../../../../helpers/utils/util'
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
    const { removeFromAddressBook, history, match, addressBook } = this.props
    const address = match.params.id
    const currentEntry = addressBook[address]
    const name = currentEntry.name !== '' ? currentEntry.name : addressSlicer(address)

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
        <div className="settings-page__header">
            { name }
            <div className="settings-page__button-group">
            <button className="button btn-primary settings-page__address-book-button"
              onClick={() => {
                history.push(`${CONTACT_EDIT_ROUTE}/${address}`)
              }}> {this.context.t('edit')} </button>
              <button className="button btn-primary settings-page__address-book-button"
              onClick={() => {
                removeFromAddressBook(address)
                history.push(CONTACT_LIST_ROUTE)
              }}> {this.context.t('remove')} </button>
            </div>
          </div>
          <div className="settings-page__content-item-col">
            <Identicon address={address} diameter={45}/>
            <div className="settings-page__content-description">
              { this.context.t('userName') }
            </div>
            { name }
          </div>
          <div className="settings-page__content-item-col">
            <div className="settings-page__content-description">
              {this.context.t('ethereumPublicAddress')}
            </div>
            <div className="settings-page__copyable-address"
              onClick={() => {
                copyToClipboard(address)
              }}>
            { address }
            <img className="settings-page__copy-icon" src="/images/copy-to-clipboard.svg"></img>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
