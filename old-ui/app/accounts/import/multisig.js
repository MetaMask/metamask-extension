const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../../ui/app/actions')

module.exports = connect(mapStateToProps)(MultisigImportView)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
  }
}

inherits(MultisigImportView, Component)
function MultisigImportView () {
  Component.call(this)
}

MultisigImportView.prototype.render = function () {
  const { error } = this.props

  return (
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '5px 0px 0px 0px',
      },
    }, [
      h('span', 'Paste address of multisig here'),

      h('input.large-input', {
        id: 'address-box',
        onKeyPress: this.createKeyringOnEnter.bind(this),
        style: {
          width: '100%',
          marginTop: 12,
          border: '1px solid #e2e2e2',
        },
      }),

      h('button', {
        onClick: this.createNewKeychain.bind(this),
        style: {
          margin: 20,
        },
      }, 'Import'),

      error ? h('span.error', error) : null,
    ])
  )
}

MultisigImportView.prototype.createKeyringOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewKeychain()
  }
}

MultisigImportView.prototype.createNewKeychain = function () {
  const input = document.getElementById('address-box')
  const addr = input.value
  this.props.dispatch(actions.importNewAccount('Multisig', [ addr ]))
    // JS runtime requires caught rejections but failures are handled by Redux
    .catch()
}
