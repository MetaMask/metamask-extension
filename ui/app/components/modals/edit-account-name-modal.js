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

inherits(BuyOptions, Component)
function BuyOptions () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(BuyOptions)

// BuyOptions is currently meant to be rendered inside <Modal />
// It is the only component in this codebase that does so
// It utilizes modal styles
BuyOptions.prototype.render = function () {
  return h('div', {}, [
    h('div.modal-content.transfers-subview', {
    }, [
      h('div.modal-content-title-wrapper.flex-column.flex-center', {
        style: {},
      }, [
        h('div.modal-content-title', {
          style: {},
        }, 'Edit Account Name Modal'),
        h('div', {}, 'How would you like to buy Ether?'),
      ]),

      h('div.modal-content-options.flex-column.flex-center', {}, [

        h('div.modal-content-option', {
          onClick: () => {
            const { toCoinbase, address } = this.props
            toCoinbase(address)
          },
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
