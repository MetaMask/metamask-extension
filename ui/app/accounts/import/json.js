const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')
const FileInput = require('react-simple-file-input').default

const HELP_LINK = 'https://support.metamask.io/kb/article/7-importing-accounts'

module.exports = connect(mapStateToProps)(JsonImportSubview)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
  }
}

inherits(JsonImportSubview, Component)
function JsonImportSubview () {
  Component.call(this)
}

JsonImportSubview.prototype.render = function () {
  const { error } = this.props

  return (
    h('div.new-account-import-form__json', [

      h('p', 'Used by a variety of different clients'),
      h('a.warning', { href: HELP_LINK, target: '_blank' }, 'File import not working? Click here!'),

      h(FileInput, {
        readAs: 'text',
        onLoad: this.onLoad.bind(this),
        style: {
          margin: '20px 0px 12px 34%',
          fontSize: '15px',
          display: 'flex',
          justifyContent: 'center',
        },
      }),

      h('input.new-account-import-form__input-password', {
        type: 'password',
        placeholder: 'Enter password',
        id: 'json-password-box',
        onKeyPress: this.createKeyringOnEnter.bind(this),
      }),

      h('div.new-account-create-form__buttons', {}, [

        h('button.new-account-create-form__button-cancel', {
          onClick: () => this.props.goHome(),
        }, [
          'CANCEL',
        ]),

        h('button.new-account-create-form__button-create', {
          onClick: () => this.createNewKeychain.bind(this),
        }, [
          'IMPORT',
        ]),

      ]),

      error ? h('span.error', error) : null,
    ])
  )
}

JsonImportSubview.prototype.onLoad = function (event, file) {
  this.setState({file: file, fileContents: event.target.result})
}

JsonImportSubview.prototype.createKeyringOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewKeychain()
  }
}

JsonImportSubview.prototype.createNewKeychain = function () {
  const state = this.state
  const { fileContents } = state

  if (!fileContents) {
    const message = 'You must select a file to import.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  const passwordInput = document.getElementById('json-password-box')
  const password = passwordInput.value

  if (!password) {
    const message = 'You must enter a password for the selected file.'
    return this.props.dispatch(actions.displayWarning(message))
  }

  this.props.dispatch(actions.importNewAccount('JSON File', [ fileContents, password ]))
}
