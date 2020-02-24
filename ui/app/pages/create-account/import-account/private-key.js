<<<<<<< HEAD
const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const actions = require('../../../store/actions')
const { DEFAULT_ROUTE } = require('../../../helpers/constants/routes')
const { getMetaMaskAccounts } = require('../../../selectors/selectors')
=======
import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as actions from '../../../store/actions'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'
import { getMetaMaskAccounts } from '../../../selectors/selectors'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import Button from '../../../components/ui/button'

class PrivateKeyImportView extends Component {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    importNewAccount: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    displayWarning: PropTypes.func.isRequired,
    setSelectedAddress: PropTypes.func.isRequired,
    firstAddress: PropTypes.string.isRequired,
    error: PropTypes.node,
  }

  inputRef = React.createRef()

  state = { isEmpty: true }

  createNewKeychain () {
    const privateKey = this.inputRef.current.value
    const { importNewAccount, history, displayWarning, setSelectedAddress, firstAddress } = this.props

    importNewAccount('Private Key', [ privateKey ])
      .then(({ selectedAddress }) => {
        if (selectedAddress) {
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Import Account',
              name: 'Imported Account with Private Key',
            },
          })
          history.push(DEFAULT_ROUTE)
          displayWarning(null)
        } else {
          displayWarning('Error importing account.')
          this.context.metricsEvent({
            eventOpts: {
              category: 'Accounts',
              action: 'Import Account',
              name: 'Error importing with Private Key',
            },
          })
          setSelectedAddress(firstAddress)
        }
      })
      .catch((err) => err && displayWarning(err.message || err))
  }

  createKeyringOnEnter = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.createNewKeychain()
    }
  }

  checkInputEmpty () {
    const privateKey = this.inputRef.current.value
    let isEmpty = true
    if (privateKey !== '') {
      isEmpty = false
    }
    this.setState({ isEmpty })
  }

  render () {
    const { error, displayWarning } = this.props

    return (
      <div className="new-account-import-form__private-key">
        <span className="new-account-create-form__instruction">
          {this.context.t('pastePrivateKey')}
        </span>
        <div className="new-account-import-form__private-key-password-container">
          <input
            className="new-account-import-form__input-password"
            type="password"
            id="private-key-box"
            onKeyPress={(e) => this.createKeyringOnEnter(e)}
            onChange={() => this.checkInputEmpty()}
            ref={this.inputRef}
          />
        </div>
        <div className="new-account-import-form__buttons">
          <Button
            type="default"
            large
            className="new-account-create-form__button"
            onClick={() => {
              displayWarning(null)
              this.props.history.push(DEFAULT_ROUTE)
            }}
          >
            {this.context.t('cancel')}
          </Button>
          <Button
            type="secondary"
            large
            className="new-account-create-form__button"
            onClick={() => this.createNewKeychain()}
            disabled={this.state.isEmpty}
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
    )
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(PrivateKeyImportView)


function mapStateToProps (state) {
  return {
    error: state.appState.warning,
    firstAddress: Object.keys(getMetaMaskAccounts(state))[0],
  }
}

function mapDispatchToProps (dispatch) {
  return {
    importNewAccount: (strategy, [ privateKey ]) => {
      return dispatch(actions.importNewAccount(strategy, [ privateKey ]))
    },
    displayWarning: (message) => dispatch(actions.displayWarning(message || null)),
    setSelectedAddress: (address) => dispatch(actions.setSelectedAddress(address)),
  }
}
<<<<<<< HEAD

inherits(PrivateKeyImportView, Component)
function PrivateKeyImportView () {
  this.createKeyringOnEnter = this.createKeyringOnEnter.bind(this)
  Component.call(this)
}

PrivateKeyImportView.prototype.render = function () {
  const { error, displayWarning } = this.props

  return (
    h('div.new-account-import-form__private-key', [

      h('span.new-account-create-form__instruction', this.context.t('pastePrivateKey')),

      h('div.new-account-import-form__private-key-password-container', [

        h('input.new-account-import-form__input-password', {
          type: 'password',
          id: 'private-key-box',
          onKeyPress: e => this.createKeyringOnEnter(e),
        }),

      ]),

      h('div.new-account-import-form__buttons', {}, [

        h(Button, {
          type: 'default',
          large: true,
          className: 'new-account-create-form__button',
          onClick: () => {
            displayWarning(null)
            this.props.history.push(DEFAULT_ROUTE)
          },
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
  )
}

PrivateKeyImportView.prototype.createKeyringOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewKeychain()
  }
}

PrivateKeyImportView.prototype.createNewKeychain = function () {
  const input = document.getElementById('private-key-box')
  const privateKey = input.value
  const { importNewAccount, history, displayWarning, setSelectedAddress, firstAddress } = this.props

  importNewAccount('Private Key', [ privateKey ])
    .then(({ selectedAddress }) => {
      if (selectedAddress) {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Import Account',
            name: 'Imported Account with Private Key',
          },
        })
        history.push(DEFAULT_ROUTE)
        displayWarning(null)
      } else {
        displayWarning('Error importing account.')
        this.context.metricsEvent({
          eventOpts: {
            category: 'Accounts',
            action: 'Import Account',
            name: 'Error importing with Private Key',
          },
        })
        setSelectedAddress(firstAddress)
      }
    })
    .catch(err => err && displayWarning(err.message || err))
}
=======
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
