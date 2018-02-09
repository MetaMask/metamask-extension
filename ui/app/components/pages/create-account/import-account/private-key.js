const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const { connect } = require('react-redux')
const actions = require('../../../../actions')
const { DEFAULT_ROUTE } = require('../../../../routes')

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(PrivateKeyImportView)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    importNewAccount: (strategy, [ privateKey ]) => {
      return dispatch(actions.importNewAccount(strategy, [ privateKey ]))
    },
    displayWarning: () => dispatch(actions.displayWarning(null)),
  }
}

inherits(PrivateKeyImportView, Component)
function PrivateKeyImportView () {
  Component.call(this)
}

PrivateKeyImportView.prototype.render = function () {
  const { error } = this.props

  return (
    h('div.new-account-import-form__private-key', [

      h('div.new-account-import-form__private-key-password-container', [

        h('span.new-account-import-form__instruction', 'Paste your private key string here:'),

        h('input.new-account-import-form__input-password', {
          type: 'password',
          id: 'private-key-box',
          onKeyPress: () => this.createKeyringOnEnter(),
        }),

      ]),

      h('div.new-account-import-form__buttons', {}, [

        h('button.new-account-create-form__button-cancel', {
          onClick: () => this.props.history.push(DEFAULT_ROUTE),
        }, [
          'CANCEL',
        ]),

        h('button.new-account-create-form__button-create', {
          onClick: () => this.createNewKeychain(),
        }, [
          'IMPORT',
        ]),

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
  const { importNewAccount, history } = this.props

  importNewAccount('Private Key', [ privateKey ])
    .then(() => history.push(DEFAULT_ROUTE))
}
