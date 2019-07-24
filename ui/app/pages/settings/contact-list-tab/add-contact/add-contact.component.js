import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'
import TextField from '../../../../components/ui/text-field'
import { CONTACT_LIST_ROUTE } from '../../../../helpers/constants/routes'
import { isValidAddress } from '../../../../helpers/utils/util'

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
    const { nickname, address, error } = this.state
    const { history, addToAddressBook } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <TextField
              type="text"
              id="nickname"
              placeholder={this.context.t('addAlias')}
              value={nickname}
              onChange={e => this.setState({ nickname: e.target.value })}
              fullWidth
              margin="dense"
            />
            <TextField
              type="text"
              id="address"
              placeholder={this.context.t('addEthAddress')}
              value={address}
              error={error}
              onChange={e => this.setState({ address: e.target.value })}
              fullWidth
              margin="dense"
            />
            </div>
          </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          onSubmit={() => {
            if (isValidAddress(address)) {
              addToAddressBook(address, nickname)
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
