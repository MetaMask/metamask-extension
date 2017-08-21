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
    }
  }
}

inherits(NewAccountModal, Component)
function NewAccountModal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(NewAccountModal)

NewAccountModal.prototype.render = function () {
  return h('div', {}, [
    h('div.new-account-modal-wrapper', {
    }, [
      h('div', {}, [
        'New Account',
      ]),

      h('div', {}, [
        h('i.fa.fa-times', {}, [
        ]),
      ]),
      
      h('div', {}, [
        'Account Name',
      ]),

      h('div', {}, [
        h('input', {
          placeholder: 'E.g. My new account'
        }, []),
      ]),

      h('div', {}, [
        'or',
      ]),

      h('div', {}, [
        'Import an account',
      ]),

      h('div', {}, [
        h('button.btn-clear', {}, [
          'SAVE',
        ]),
      ]),
    ])
  ])
}
