import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import PageContainerFooter from '../../../../components/ui/page-container/page-container-footer'
import TextField from '../../../../components/ui/text-field'
import { CONTACT_LIST_ROUTE } from '../../../../helpers/constants/routes'

export default class AddContact extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    addressBook: PropTypes.array,
    addToAddressBook: PropTypes.func,
    history: PropTypes.object,
  }

  state = {
    nickname: '',
    address: '',

  }

  renderFormTextField (fieldKey, textFieldId, onChange, value, optionalTextFieldKey) {
    return (
      <div className="networks-tab__network-form-row">
        <div className="networks-tab__network-form-label">{this.context.t(optionalTextFieldKey || fieldKey)}</div>
        <TextField
          type="text"
          id={textFieldId}
          onChange={onChange}
          fullWidth
          margin="dense"
          value={value}
        />
      </div>
    )
  }

  setStateWithValue = (stateKey, validator) => {
    return (e) => {
      validator && validator(e.target.value, stateKey)
      this.setState({ [stateKey]: e.target.value })
    }
  }

   render () {
    const { t } = this.context
    const { nickname, address } = this.state
    const { history, addToAddressBook } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
        <div className="settings-page__header">
          { this.context.t('newContact') }
        </div>
          <div className="settings-page__content-item-col">

            <TextField
              type="text"
              id="nickname"
              placeholder={t('addAlias')}
              value={nickname}
              onChange={e => this.setState({ nickname: e.target.value })}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                }
              }}
              fullWidth
              margin="dense"
            />

            <TextField
              type="text"
              id="address"
              placeholder={t('addEthAddress')}
              value={address}
              onChange={e => this.setState({ address: e.target.value })}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                }
              }}
              fullWidth
              margin="dense"
            />
            </div>
          </div>
        <PageContainerFooter
          cancelText={this.context.t('cancel')}
          onSubmit={() => {
            addToAddressBook(address, nickname)
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
