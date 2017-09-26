const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    address: state.metamask.selectedAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toCoinbase: (address) => {
      dispatch(actions.buyEth({ network: '1', address, amount: 0 }))
    },
    hideModal: () => {
      dispatch(actions.hideModal())
    },
    createAccount: (newAccountName) => {
      dispatch(actions.addNewAccount())
        .then((newAccountAddress) => {
          if (newAccountName) {
            dispatch(actions.saveAccountLabel(newAccountAddress, newAccountName))
          }
          dispatch(actions.hideModal())
        })
    },
  }
}

inherits(NewAccountModal, Component)
function NewAccountModal () {
  Component.call(this)

  this.state = {
    newAccountName: ''
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountModal)

NewAccountModal.prototype.render = function () {
  const { newAccountName } = this.state

  return h('div', {}, [
    h('div.new-account-modal-wrapper', {
    }, [
      h('div.new-account-modal-header', {}, [
        'New Account',
      ]),

      h('div.modal-close-x', {
        onClick: this.props.hideModal,
      }),

      h('div.new-account-modal-content', {}, [
        'Account Name',
      ]),

      h('div.new-account-input-wrapper', {}, [
        h('input.new-account-input', {
          placeholder: 'E.g. My new account',
          onChange: (event) => this.setState({ newAccountName: event.target.value })
        }, []),
      ]),

      h('div.new-account-modal-content.after-input', {}, [
        'or',
      ]),

      h('div.new-account-modal-content.after-input', {}, [
        'Import an account',
      ]),

      h('div.new-account-modal-content.button', {}, [
        h('button.btn-clear', {
          onClick: () => this.props.createAccount(newAccountName)
        }, [
          'SAVE',
        ]),
      ]),
    ]),
  ])
}
