const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../actions')

module.exports = connect(mapStateToProps)(PrivateKeyImportView)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
  }
}

inherits(PrivateKeyImportView, Component)
function PrivateKeyImportView () {
  Component.call(this)
}

PrivateKeyImportView.prototype.render = function () {
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
      h('span', 'Paste your private key string here'),

      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'private-key-box',
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

PrivateKeyImportView.prototype.createKeyringOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewKeychain()
  }
}

PrivateKeyImportView.prototype.createNewKeychain = function () {
  const input = document.getElementById('private-key-box')
  const privateKey = input.value
  this.props.dispatch(actions.importNewAccount('Private Key', [ privateKey ]))
}

