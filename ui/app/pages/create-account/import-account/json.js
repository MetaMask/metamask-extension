<<<<<<< HEAD
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
const FileInput = require('react-simple-file-input').default
const { DEFAULT_ROUTE } = require('../../../helpers/constants/routes')
const { getMetaMaskAccounts } = require('../../../selectors/selectors')
=======
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import FileInput from 'react-simple-file-input'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'
import { getMetaMaskAccounts } from '../../../selectors/selectors'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import Button from '../../../components/ui/button'

const HELP_LINK = 'https://metamask.zendesk.com/hc/en-us/articles/360015489331-Importing-an-Account'

class JsonImportSubview extends Component {
<<<<<<< HEAD
  constructor (props) {
    super(props)

    this.state = {
      file: null,
      fileContents: '',
    }
=======
  state = {
    fileContents: '',
    isEmpty: true,
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  }

  inputRef = React.createRef()

  render () {
    const { error } = this.props
    const enabled = !this.state.isEmpty && this.state.fileContents !== ''

    return (
      h('div.new-account-import-form__json', [

        h('p', this.context.t('usedByClients')),
        h('a.warning', {
          href: HELP_LINK,
          target: '_blank',
        }, this.context.t('fileImportFail')),

        h(FileInput, {
          readAs: 'text',
          onLoad: this.onLoad.bind(this),
          style: {
            padding: '20px 0px 12px 15%',
            fontSize: '15px',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
<<<<<<< HEAD
          },
        }),

        h('input.new-account-import-form__input-password', {
          type: 'password',
          placeholder: this.context.t('enterPassword'),
          id: 'json-password-box',
          onKeyPress: this.createKeyringOnEnter.bind(this),
        }),

        h('div.new-account-create-form__buttons', {}, [

          h(Button, {
            type: 'default',
            large: true,
            className: 'new-account-create-form__button',
            onClick: () => this.props.history.push(DEFAULT_ROUTE),
          }, [this.context.t('cancel')]),

          h(Button, {
            type: 'secondary',
            large: true,
            className: 'new-account-create-form__button',
            onClick: () => this.createNewKeychain(),
          }, [this.context.t('import')]),

        ]),

        error ? h('span.error', error) : null,
      ])
=======
          }}
        />
        <input
          className="new-account-import-form__input-password"
          type="password"
          placeholder={this.context.t('enterPassword')}
          id="json-password-box"
          onKeyPress={this.createKeyringOnEnter.bind(this)}
          onChange={() => this.checkInputEmpty()}
          ref={this.inputRef}
        />
        <div className="new-account-create-form__buttons">
          <Button
            type="default"
            large
            className="new-account-create-form__button"
            onClick={() => this.props.history.push(DEFAULT_ROUTE)}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="secondary"
            large
            className="new-account-create-form__button"
            onClick={() => this.createNewKeychain()}
            disabled={!enabled}
          >
            {this.context.t('import')}
          </Button>
        </div>
        {
          error
            ? <span className="error">{error}</span>
            : null
        }
      </div>
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
    )
  }

  onLoad (event, file) {
    this.setState({file: file, fileContents: event.target.result})
  }

  createKeyringOnEnter (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewKeychain()
    }
  }

  createNewKeychain () {
    const { firstAddress, displayWarning, importNewJsonAccount, setSelectedAddress, history } = this.props
    const state = this.state

    if (!state) {
      const message = this.context.t('validFileImport')
      return displayWarning(message)
    }

    const { fileContents } = state

    if (!fileContents) {
      const message = this.context.t('needImportFile')
      return displayWarning(message)
    }

    const password = this.inputRef.current.value

    importNewJsonAccount([ fileContents, password ])
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          history.push(DEFAULT_ROUTE)
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Import Account',
              name: 'Imported Account with JSON',
            },
          })
          displayWarning(null)
        } else {
          displayWarning('Error importing account.')
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Import Account',
              name: 'Error importing JSON',
            },
          })
          setSelectedAddress(firstAddress)
        }
      })
      .catch((err) => err && displayWarning(err.message || err))
  }

  checkInputEmpty () {
    const password = this.inputRef.current.value
    let isEmpty = true
    if (password !== '') {
      isEmpty = false
    }
    this.setState({ isEmpty })
  }
}

JsonImportSubview.propTypes = {
  error: PropTypes.string,
  displayWarning: PropTypes.func,
  firstAddress: PropTypes.string,
  importNewJsonAccount: PropTypes.func,
  history: PropTypes.object,
  setSelectedAddress: PropTypes.func,
}

const mapStateToProps = (state) => {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(getMetaMaskAccounts(state))[0],
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    displayWarning: (warning) => dispatch(actions.displayWarning(warning)),
    importNewJsonAccount: (options) => dispatch(actions.importNewAccount('JSON File', options)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}

JsonImportSubview.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(JsonImportSubview)
