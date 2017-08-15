const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const BuyOptions = require('../buy-options')
const Modal = require('./modal.js')

inherits(BuyModal, Component)
function BuyModal () {
  Component.call(this)
}

module.exports = BuyModal

BuyModal.prototype.render = function () {
  return h(Modal, {
    ref: "modalRef",
  }, [
    h(BuyOptions, {}, []),
  ])

}

// TODO: specify default props and proptypes

// Generalize to multiple modals:
//   Modal API:
//    - props {
//      key: ['BUY', 'EDIT_ACCOUNT_NAME', 'ACCOUNT_DETAILS']
//    }
//    - These props will be passed as 'active'
//      mapStateToProps(state, ownProps) {
//        active: state.appState.modal[key]
//      }
//    - Modal accepts:
//      - mobileModalStyles, for mobile viewports
//      - laptopModalStyles, for laptop viewports
//      - backdropStyles
//      - Do not set defaults, they are unneeded here
// 
// If multiple-step modals are needed:
//  - pass a component with internal state that tracks buy steps
//    - steps could technically be in redux
//  - it renders and does not trigger open/close actions until done