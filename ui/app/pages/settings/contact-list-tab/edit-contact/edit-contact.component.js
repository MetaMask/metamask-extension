import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import { CONTACT_LIST_ROUTE } from '../../../../helpers/constants/routes'
import { addressSlicer } from '../../../../helpers/utils/util'
import TextField from '../../../../components/ui/text-field'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'

export default class EditContact extends PureComponent {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addressBook: PropTypes.object,
    addToAddressBook: PropTypes.func,
    history: PropTypes.object,
    match: PropTypes.object,
  }

  state = {
    newName: '',
    newAddress: '',
  }

   render () {
    const { t } = this.context
    const { history, match, addressBook, addToAddressBook } = this.props
    const { newName } = this.state
    const address = match.params.id
    const currentEntry = addressBook.filter(contact => contact.address === address)[0] || {}
    const name = currentEntry.name !== '' ? currentEntry.name : addressSlicer(address)

    return (
      <div className="settings-page__content-row address-book__edit-contact">
        <div className="settings-page__header address-book__header">
          <Identicon address={address} diameter={60}/>
        </div>
        <div className="address-book__edit-contact__content">
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('userName') }
            </div>
            <input
              type="text"
              className="address-book__input"
              placeholder={name}
              value={this.state.newName || name}
              onChange={e => this.setState({ newName: e.target.value })}
            />
          </div>
          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('ethereumPublicAddress') }
            </div>
            <input
              type="text"
              className="address-book__input address-book__input--address"
              placeholder={address}
              value={this.state.newAddress || address}
              onChange={e => this.setState({ newAddress: e.target.value })}
            />
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          onSubmit={() => {
            addToAddressBook(address, newName)
            history.push(CONTACT_LIST_ROUTE)
          }}
          onCancel={() => {
            history.push(CONTACT_LIST_ROUTE)
          }}
          submitText={this.context.t('save')}
          submitButtonType={'confirm'}
        />
      </div>
    )
  }
}
