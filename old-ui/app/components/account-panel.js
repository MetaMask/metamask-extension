const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
const Identicon = require('./identicon')
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary

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
        key: 'Address',
        value: addressSummary(identity.address),
      },
      balanceOrFaucetingIndication(account, isFauceting, state.network),
    ],
  }

  return (

    h('.identity-panel.flex-row.flex-space-between', {
      style: {
        background: ((state.style && state.style.background) || 'linear-gradient(rgb(84, 36, 147), rgb(104, 45, 182))'),
        padding: '30px',
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
          diameter: 60,
        }),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [
        h('h2.font-medium', {
          style: {
            color: '#ffffff',
            marginBottom: '20px',
            lineHeight: '16px',
          },
        }, panelState.identiconLabel),
        panelState.attributes.map((attr, i) => {
          return h('.flex-row.flex-space-between', {
            key: '' + Math.round(Math.random() * 1000000),
          }, [
            h('label.font-pre-medium.no-select', {
              style: {
                color: '#ffffff',
                marginBottom: i === 0 ? '10px' : '0px',
                lineHeight: '14px',
              },
            }, attr.key),
            h('span.font-pre-medium', {
              style: {
                color: '#ffffff',
                lineHeight: '14px',
              },
            }, attr.value),
          ])
        }),
      ]),

    ])

  )
}

function balanceOrFaucetingIndication (account, isFauceting, network) {
  // Temporarily deactivating isFauceting indication
  // because it shows fauceting for empty restored accounts.
  if (/* isFauceting*/ false) {
    return {
      key: 'Account is auto-funding.',
      value: 'Please wait.',
    }
  } else {
    return {
      key: 'Balance',
      value: formatBalance(account.balance, undefined, undefined, network),
    }
  }
}
