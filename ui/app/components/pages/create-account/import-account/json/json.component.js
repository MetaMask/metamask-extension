import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FileInput from 'react-simple-file-input'
import { DEFAULT_ROUTE } from '../../../../../routes'


const HELP_LINK = 'https://support.metamask.io/kb/article/7-importing-accounts'

export default class JsonImportSubview extends Component {

  static propTypes = {
    error: PropTypes.string,
    goHome: PropTypes.func,
    displayWarning: PropTypes.func,
    firstAddress: PropTypes.string,
    importNewJsonAccount: PropTypes.func,
    history: PropTypes.object,
    setSelectedAddress: PropTypes.func,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    file: null,
    fileContents: '',
  }

  render () {
    const { error } = this.props

    return (
      <div className={'new-account-import-form__json'}>
        <p>{this.context.t('usedByClients')}</p>
        <a className={'warning'} href={HELP_LINK} target={'_blank'}>{this.context.t('fileImportFail')}</a>
        <FileInput
          readAs={'text'}
          onLoad={this.onLoad.bind(this)}
          style={{
            margin: '20px 0px 12px 34%',
            fontSize: '15px',
            display: 'flex',
            justifyContent: 'center',
          }}
        />
        <input
          className={'new-account-import-form__input-password'}
          type={'password'}
          placeholder={this.context.t('enterPassword')}
          id={'json-password-box'}
          onKeyPress={this.createKeyringOnEnter.bind(this)}
        />
        <div className={'new-account-import-form__buttons'}>
          <button
            className={'btn-default new-account-import-form__button'}
            onClick={() => this.props.history.push(DEFAULT_ROUTE)}
          >
            {this.context.t('cancel')}
          </button>
          <button
            className={'btn-primary new-account-import-form__button'}
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

  onLoad (event, file) {
    this.setState({
      file: file,
      fileContents: event.target.result,
    })
  }

  createKeyringOnEnter (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewKeychain()
    }
  }

  createNewKeychain () {
    const { firstAddress, displayWarning, importNewJsonAccount, setSelectedAddress } = this.props
    const { file, fileContents } = this.state

    if (!file) {
      const message = this.context.t('validFileImport')
      return displayWarning(message)
    }

    if (!fileContents) {
      const message = this.context.t('needImportFile')
      return displayWarning(message)
    }

    const passwordInput = document.getElementById('json-password-box')
    const password = passwordInput.value

    if (!password) {
      const message = this.context.t('needImportPassword')
      return displayWarning(message)
    }

    importNewJsonAccount([ fileContents, password ])
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
