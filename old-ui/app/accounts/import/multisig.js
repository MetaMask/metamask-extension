const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const actions = require('../../../../ui/app/actions')
const Web3 = require('web3')

module.exports = connect(mapStateToProps, mapDispatchToProps)(MultisigImportView)

function mapStateToProps (state) {
  return {
    error: state.appState.warning,
    network: state.metamask.network,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    displayWarning: warning => dispatch(actions.displayWarning(warning)),
    importNewAccount: (strategy, args) => dispatch(actions.importNewAccount(strategy, args)),
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
        style: {
          width: '100%',
          marginTop: '12px',
          border: '1px solid #e2e2e2',
        },
      }),

      h('span', {
        style: {
            marginTop: '20px',
          },
        }, 'Paste ABI of multisig here'),

      h('textarea', {
        id: 'abi-box',
        style: {
          marginTop: '12px',
          width: '100%',
          height: '50px',
        },
        onKeyPress: this.createKeyringOnEnter.bind(this),
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
  const web3 = new Web3()
  const addressInput = document.getElementById('address-box')
  const abiInput = document.getElementById('abi-box')
  const addr = addressInput.value
  let abi
  try {
    abi = JSON.parse(abiInput.value)
  } catch (e) {
    this.props.displayWarning('Invalid ABI')
  }

  if (!addr || !web3.isAddress(addr)) {
    return this.props.displayWarning('Invalid multisig address')
  }

  if (!abi) {
    return this.props.displayWarning('Invalid multisig ABI')
  }

  this.props.importNewAccount('Multisig', { addr, network: this.props.network, abi })
  // JS runtime requires caught rejections but failures are handled by Redux
  .catch()
}
