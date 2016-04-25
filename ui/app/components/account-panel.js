const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const Component = require('react').Component
const h = require('react-hyperscript')
const addressSummary = require('../util').addressSummary
const formatBalance = require('../util').formatBalance

module.exports = AccountPanel


inherits(AccountPanel, Component)
function AccountPanel() {
  Component.call(this)
}

AccountPanel.prototype.render = function() {
  var state = this.props
  var identity = state.identity || {}
  var account = state.account || {}
  var isFauceting = state.isFauceting

  return (

    h('.identity-panel.flex-row.flex-space-between'+(state.isSelected?'.selected':''), {
      style: {
        flex: '1 0 auto',
      },
      onClick: state.onShowDetail && state.onShowDetail.bind(null, identity.address),
    }, [

      // account identicon
      h('.identicon-wrapper.flex-column.select-none', [
        h('.identicon', {
          style: { backgroundImage: 'url("https://ipfs.io/ipfs/'+identity.img+'")' }
        }),
        h('span.font-small', identity.name),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [

        h('.flex-row.flex-space-between', [
          h('label.font-small', 'ADDRESS'),
          h('span.font-small', addressSummary(identity.address)),
        ]),

        balanceOrFaucetingIndication(account, isFauceting),

        // outlet for inserting additional stuff
        state.children,

      ]),

      // navigate to account detail
      !state.onShowDetail ? null :
        h('.arrow-right.cursor-pointer', {
          onClick: state.onShowDetail && state.onShowDetail.bind(null, identity.address),
        }, [
          h('i.fa.fa-chevron-right.fa-lg'),
        ]),
    ])
  )
}

function balanceOrFaucetingIndication(account, isFauceting) {

  // Temporarily deactivating isFauceting indication
  // because it shows fauceting for empty restored accounts.
  if (/*isFauceting*/ false) {

    return h('.flex-row.flex-space-between', [
      h('span.font-small', {
      }, [
        'Account is auto-funding,',
        h('br'),
        'please wait.'
      ]),
    ])

  } else {

    return h('.flex-row.flex-space-between', [
      h('label.font-small', 'BALANCE'),
      h('span.font-small', {
        style: {
          overflowX: 'hidden',
          maxWidth: '136px',
        }
      }, formatBalance(account.balance)),
    ])

  }
}
