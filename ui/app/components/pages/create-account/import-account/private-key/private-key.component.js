import React, { Component } from 'react'
import PropTypes from 'prop-types'
const { DEFAULT_ROUTE } = require('../../../../../routes')


export default class PrivateKeyImportView extends Component {

  static propTypes = {
    error: PropTypes.string,
    displayWarning: PropTypes.func,
    importNewAccount: PropTypes.func,
    history: PropTypes.object,
    setSelectedAddress: PropTypes.func,
    firstAddress: PropTypes.string,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    const { error, displayWarning } = this.props

    return (
      <div className={'new-account-import-form__private-key'}>
        <span className={'new-account-create-form__instruction'}>
          {this.context.t('pastePrivateKey')}
        </span>
        <div className={'new-account-import-form__private-key-password-container'}>
          <input
            className={'new-account-import-form__input-password'}
            type={'password'}
            id={'private-key-box'}
            onKeyPress={this.createKeyringOnEnter.bind(this)}
          />
        </div>
        <div className={'new-account-import-form__buttons'}>
          <button
            className={'btn-default btn--large.new-account-import-form__button'}
            onClick={() => {
              displayWarning(null)
              this.props.history.push(DEFAULT_ROUTE)
            }}
          >
            {this.context.t('cancel')}
          </button>
          <button
            className={'btn-primary btn--large.new-account-import-form__button'}
            onClick={() => this.createNewKeychain()}
          >
            {this.context.t('import')}
          </button>
        </div>
        {
          error
          ? <span className={'error'}>{error}</span>
          : null
        }
      </div>
    )
  }

  createKeyringOnEnter (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewKeychain()
    }
  }

  createNewKeychain () {
    const input = document.getElementById('private-key-box')
    const privateKey = input.value
    const { importNewAccount, history, displayWarning, setSelectedAddress, firstAddress } = this.props

    importNewAccount('Private Key', [ privateKey ])
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          history.push(DEFAULT_ROUTE)
          displayWarning(null)
        } else {
          displayWarning('Error importing account.')
          setSelectedAddress(firstAddress)
        }
      })
      .catch(err => err && displayWarning(err.message || err))
  }
}
