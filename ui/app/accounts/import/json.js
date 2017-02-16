const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')
const FileInput = require('react-simple-file-input').default

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
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '5px 15px 0px 15px',
      },
    }, [

      h('p', 'Used by a variety of different clients'),

      h(FileInput, {
        readAs: 'text',
        onLoad: this.onLoad.bind(this),
        style: {
          margin: '20px 0px 12px 20px',
          fontSize: '15px',
        },
      }),

      h('input.large-input.letter-spacey', {
        type: 'password',
        placeholder: 'Enter password',
        id: 'json-password-box',
        onKeyPress: this.createKeyringOnEnter.bind(this),
        style: {
          width: 260,
          marginTop: 12,
        },
      }),

      h('button.primary', {
        onClick: this.createNewKeychain.bind(this),
        style: {
          margin: 12,
        },
      }, 'Import'),

      error ? h('span.warning', error) : null,
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

