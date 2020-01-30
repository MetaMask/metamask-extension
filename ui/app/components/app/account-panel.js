const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
import Identicon from '../ui/identicon'
const formatBalance = require('../../helpers/utils/util').formatBalance
const addressSummary = require('../../helpers/utils/util').addressSummary

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

  var panelState = {
    key: `accountPanel${identity.address}`,
    identiconKey: identity.address,
    identiconLabel: identity.name || '',
    attributes: [
      {
        key: 'ADDRESS',
        value: addressSummary(identity.address),
      },
      balanceOrFaucetingIndication(account, isFauceting),
    ],
  }

  return (

    h('.identity-panel.flex-row.flex-space-between', {
      style: {
        flex: '1 0 auto',
        cursor: panelState.onClick ? 'pointer' : undefined,
      },
      onClick: panelState.onClick,
    }, [

      // account identicon
      h('.identicon-wrapper.flex-column.select-none', [
        h(Identicon, {
          address: panelState.identiconKey,
          imageify: state.imageifyIdenticons,
        }),
        h('span.font-small', panelState.identiconLabel.substring(0, 7) + '...'),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [

        panelState.attributes.map((attr) => {
          return h('.flex-row.flex-space-between', {
            key: '' + Math.round(Math.random() * 1000000),
          }, [
            h('label.font-small.no-select', attr.key),
            h('span.font-small', attr.value),
          ])
        }),
      ]),

    ])

  )
}

function balanceOrFaucetingIndication (account) {
  return {
    key: 'BALANCE',
    value: formatBalance(account.balance),
  }
}
