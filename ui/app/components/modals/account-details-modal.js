const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')

function mapStateToProps (state) {
  return {
    address: state.metamask.selectedAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    }
  }
}

inherits(AccountDetailsModal, Component)
function AccountDetailsModal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)

// AccountDetailsModal is currently meant to be rendered inside <Modal />
// It is the only component in this codebase that does so
// It utilizes modal styles
AccountDetailsModal.prototype.render = function () {
  return h('div', {}, [
    h('div.modal-content.transfers-subview', {
    }, [
      h('div.modal-content-title-wrapper.flex-column.flex-center', {
        style: {},
      }, [
        h('div.modal-content-title', {
          style: {},
        }, 'Account Details Modal'),
        h('div', {}, 'How would you like to buy Ether?'),
      ]),

      h('div.modal-content-options.flex-column.flex-center', {}, [

        h('div.modal-content-option', {
          onClick: () => {},
        }, [
          h('div.modal-content-option-title', {}, 'Coinbase'),
          h('div.modal-content-option-subtitle', {}, 'Buy with Fiat'),
        ]),

        h('div.modal-content-option', {}, [
          h('div.modal-content-option-title', {}, 'Shapeshift'),
          h('div.modal-content-option-subtitle', {}, 'Trade any digital asset for any other'),
        ]),

        h('div.modal-content-option', {}, [
          h('div.modal-content-option-title', {}, 'Direct Deposit'),
          h('div.modal-content-option-subtitle', {}, 'Deposit from another account'),
        ]),

      ]),

      h('button', {
        style: {
          background: 'white',
        },
        onClick: () => { this.props.hideModal() },
      }, h('div.modal-content-footer#modal-content-footer-text',{}, 'Cancel')),
    ])
  ])
}
