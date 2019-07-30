import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import TextField from '../../../../components/ui/text-field'
import { CONTACT_LIST_ROUTE, CONTACT_VIEW_ROUTE } from '../../../../helpers/constants/routes'
import { isValidAddress } from '../../../../helpers/utils/util'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'

export default class EditContact extends PureComponent {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addToAddressBook: PropTypes.func,
    removeFromAddressBook: PropTypes.func,
    history: PropTypes.object,
    name: PropTypes.string,
    address: PropTypes.string,
  }

  state = {
    newName: '',
    newAddress: '',
    error: '',
  }

   render () {
    const { t } = this.context
    const { history, name, addToAddressBook, removeFromAddressBook, address } = this.props

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
            <TextField
              type="text"
              id="nickname"
              placeholder={this.context.t('addAlias')}
              value={this.state.newName || name}
              onChange={e => this.setState({ newName: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>

          <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
              { t('ethereumPublicAddress') }
            </div>
            <TextField
              type="text"
              id="address"
              placeholder={address}
              value={this.state.newAddress || address}
              error={this.state.error}
              onChange={e => this.setState({ newAddress: e.target.value })}
              fullWidth
              margin="dense"
            />
          </div>
        </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          onSubmit={() => {
            if (this.state.newAddress !== '' && this.state.newAddress !== address) {
              // if the user makes a valid change to the address field, remove the original address
              if (isValidAddress(this.state.newAddress)) {
                removeFromAddressBook(address)
                addToAddressBook(this.state.newAddress, this.state.newName || name)
                history.push(CONTACT_LIST_ROUTE)
              } else {
                this.setState({ error: 'invalid address' })
              }
            } else {
              // update name
              addToAddressBook(address, this.state.newName || name)
              history.push(CONTACT_LIST_ROUTE)
            }
          }}
          onCancel={() => {
            history.push(`${CONTACT_VIEW_ROUTE}/${address}`)
          }}
          submitText={this.context.t('save')}
          submitButtonType={'confirm'}
        />
      </div>
    )
  }
}
