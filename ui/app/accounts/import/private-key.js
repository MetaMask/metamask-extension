const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('../../metamask-connect')
const actions = require('../../actions')

module.exports = connect(mapStateToProps, mapDispatchToProps)(PrivateKeyImportView)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    goHome: () => dispatch(actions.goHome()),
    importNewAccount: (strategy, [ privateKey ]) => {
      dispatch(actions.importNewAccount(strategy, [ privateKey ]))
    },
    displayWarning: () => dispatch(actions.displayWarning(null)),
  }
}

inherits(PrivateKeyImportView, Component)
function PrivateKeyImportView () {
  Component.call(this)
}

PrivateKeyImportView.prototype.render = function () {
  const { error, goHome } = this.props

  return (
    h('div.new-account-import-form__private-key', [

      h('span.new-account-create-form__instruction', this.props.t('pastePrivateKey')),

      h('div.new-account-import-form__private-key-password-container', [

        h('input.new-account-import-form__input-password', {
          type: 'password',
          id: 'private-key-box',
          onKeyPress: () => this.createKeyringOnEnter(),
        }),

      ]),

      h('div.new-account-import-form__buttons', {}, [

        h('button.new-account-create-form__button-cancel.allcaps', {
          onClick: () => goHome(),
        }, [
          this.props.t('cancel'),
        ]),

        h('button.new-account-create-form__button-create.allcaps', {
          onClick: () => this.createNewKeychain(),
        }, [
          this.props.t('import'),
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

  this.props.importNewAccount('Private Key', [ privateKey ])
}
