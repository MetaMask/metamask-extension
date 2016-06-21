const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary

const Panel = require('./panel')

module.exports = AccountPanel

inherits(AccountPanel, Component)
function AccountPanel () {
  Component.call(this)
}

AccountPanel.prototype.render = function () {
  var state = this.props
  var identity = state.identity || {}
  var account = state.account || {}
  var isFauceting = state.isFauceting

  var panelOpts = {
    key: `accountPanel${identity.address}`,
    onClick: (event) => {
      if (state.onShowDetail) {
        state.onShowDetail(identity.address, event)
      }
    },
    identiconKey: identity.address,
    identiconLabel: identity.name,
    attributes: [
      {
        key: 'ADDRESS',
        value: addressSummary(identity.address),
      },
      balanceOrFaucetingIndication(account, isFauceting),
    ],
  }

  return h(Panel, panelOpts,
  !state.onShowDetail ? null : h('.arrow-right.cursor-pointer', [
    h('i.fa.fa-chevron-right.fa-lg'),
  ]))
}

function balanceOrFaucetingIndication (account, isFauceting) {
  // Temporarily deactivating isFauceting indication
  // because it shows fauceting for empty restored accounts.
  if (/* isFauceting*/ false) {
    return {
      key: 'Account is auto-funding.',
      value: 'Please wait.',
    }
  } else {
    return {
      key: 'BALANCE',
      value: formatBalance(account.balance),
    }
  }
}
