import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_ROUTE } from '../../../../routes'


export default class NewAccountCreateForm extends Component {

  static propTypes = {
    hideModal: PropTypes.func,
    showImportPage: PropTypes.func,
    createAccount: PropTypes.func,
    numberOfExistingAccounts: PropTypes.number,
    history: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    numberOfExistingAccounts: 0,
  }

  state = {
    newAccountName: '',
    defaultAccountName: this.context.t('newAccountNumberName', [this.props.numberOfExistingAccounts + 1]),
  }

  render () {
    const { newAccountName, defaultAccountName } = this.state
    const { history, createAccount } = this.props

    return (
      <div className={'new-account-create-form'}>
        <div className={'new-account-create-form__input-label'}>
          {this.context.t('accountName')}
        </div>
        <div className={'new-account-create-form__input-wrapper'}>
          <input
            className={'new-account-create-form__input'}
            value={newAccountName}
            placeholder={defaultAccountName}
            onChange={event => this.setState({ newAccountName: event.target.value })}
          />
        </div>
        <div className={'new-account-create-form__buttons'}>
          <button
            className={'btn-default btn--large new-account-create-form__button'}
            onClick={() => history.push(DEFAULT_ROUTE)}
          >
            {this.context.t('cancel')}
          </button>
          <button
            className={'btn-primary btn--large new-account-create-form__button'}
            onClick={() => createAccount(newAccountName || defaultAccountName).then(() => history.push(DEFAULT_ROUTE))}
          >
            {this.context.t('create')}
          </button>
        </div>
      </div>
    )
  }
}
