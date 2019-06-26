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
  }

   render () {
    const { history, match, addressBook, addToAddressBook } = this.props
    const { newName } = this.state
    const address = match.params.id
     const currentEntry = addressBook.filter(contact => contact.address === address)[0] || {}
    const name = currentEntry.name !== '' ? currentEntry.name : addressSlicer(address)

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">

          <div className="settings-page__content-item-col">
            <Identicon address={address} diameter={45}/>
            <div className="settings-page__content-description">
              { this.context.t('userName') }
            </div>
          </div>

          <TextField
              type="text"
              id="name"
              placeholder={name}
              onChange={e => this.setState({ newName: e.target.value })}
              fullWidth
              margin="dense"
            />
            <div className="settings-page__content-description">
              { this.context.t('ethereumPublicAddress') }
            </div>
            <div className="settings-page__content-item-col">
              {address}
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
