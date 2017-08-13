const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const FadeModal = require('boron').FadeModal
const actions = require('../../actions')
const isMobileView = require('../../../lib/is-mobile-view')
const isPopupOrNotification = require('../../../../app/scripts/lib/is-popup-or-notification')
const BuyOptions = require('../buy-options')

inherits(BuyModal, Component)
function BuyModal () {
  Component.call(this)
}

module.exports = BuyModal

BuyModal.prototype.render = function () {
  return h(BuyModal, {
    ref: "modalRef",
  }, [
    h(BuyOptions, {}, []),
  ])

}

// TODO: specify default props and proptypes
