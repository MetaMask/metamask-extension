import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../../../../components/ui/identicon'
import TextField from '../../../../components/ui/text-field'
import { CONTACT_LIST_ROUTE } from '../../../../helpers/constants/routes'
import { isValidAddress } from '../../../../helpers/utils/util'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'

export default class AddContact extends PureComponent {

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addToAddressBook: PropTypes.func,
    history: PropTypes.object,
  }

  state = {
    nickname: '',
    address: '',
    error: '',
  }

  render () {
    const { t } = this.context
    const { nickname, address, error } = this.state
    const { history, addToAddressBook } = this.props

    return (
      <div className="settings-page__content-row address-book__add-contact">
        <div className="address-book__add-contact__content">
            <div className="address-book__view-contact__group">
            <div className="address-book__view-contact__group__label">
                { t('userName') }
            </div>
            <TextField
              type="text"
              id="nickname"
              value={this.state.newName}
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
              value={this.state.newAddress}
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
            if (isValidAddress(this.state.newAddress)) {
              addToAddressBook(this.state.newAddress, this.state.newName)
              history.push(CONTACT_LIST_ROUTE)
            } else {
              this.setState({ error: 'invalid address' })
            }
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
