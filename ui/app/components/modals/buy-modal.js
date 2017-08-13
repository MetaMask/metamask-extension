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
