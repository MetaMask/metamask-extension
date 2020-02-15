import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import Button from '../../components/ui/button'

export default class NewAccountCreateForm extends Component {
  static defaultProps = {
    newAccountNumber: 0,
  }

  state = {
    newAccountName: '',
    defaultAccountName: this.context.t('newAccountNumberName', [
      this.props.newAccountNumber,
    ]),
  }

  render () {
    const { newAccountName, defaultAccountName } = this.state
    const { history, createAccount } = this.props
    const createClick = (_) => {
      createAccount(newAccountName || defaultAccountName)
        .then(() => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Add New Account',
              name: 'Added New Account',
            },
          })
          history.push(DEFAULT_ROUTE)
        })
        .catch((e) => {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Add New Account',
              name: 'Error',
            },
            customVariables: {
              errorMessage: e.message,
            },
          })
        })
    }

    return (
      <div className="new-account-create-form">
        <div className="new-account-create-form__input-label">
          {this.context.t('accountName')}
        </div>
        <div className="new-account-create-form__input-wrapper">
          <input
            className="new-account-create-form__input"
            value={newAccountName}
            placeholder={defaultAccountName}
            onChange={(event) => this.setState({ newAccountName: event.target.value })}
          />
        </div>
        <div className="new-account-create-form__buttons">
          <Button
            type="default"
            large
            className="new-account-create-form__button"
            onClick={() => history.push(DEFAULT_ROUTE)}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="secondary"
            large
            className="new-account-create-form__button"
            onClick={createClick}
          >
            {this.context.t('create')}
          </Button>
        </div>
      </div>
    )
  }
}

NewAccountCreateForm.propTypes = {
  createAccount: PropTypes.func,
  newAccountNumber: PropTypes.number,
  history: PropTypes.object,
}

NewAccountCreateForm.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}
