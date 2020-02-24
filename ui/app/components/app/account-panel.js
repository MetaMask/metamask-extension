<<<<<<< HEAD
const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')
=======
import React, { Component } from 'react'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import Identicon from '../ui/identicon'
import { addressSummary, formatBalance } from '../../helpers/utils/util'

export default class AccountPanel extends Component {
  render () {
    const state = this.props
    const identity = state.identity || {}
    const account = state.account || {}
    const isFauceting = state.isFauceting

    const panelState = {
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

<<<<<<< HEAD
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
=======
    return (
      <div
        className="identity-panel flex-row flex-space-between"
        style={{ flex: '1 0 auto', cursor: panelState.onClick ? 'pointer' : undefined }}
        onClick={panelState.onClick}
      >
        <div className="identicon-wrapper flex-column select-none">
          <Identicon address={panelState.identiconKey} imageify={state.imageifyIdenticons} />
          <span className="font-small">{panelState.identiconLabel.substring(0, 7) + '...'}</span>
        </div>
        <div className="identity-data flex-column flex-justify-center flex-grow select-none">
          {panelState.attributes.map((attr, index) => (
            <div className="flex-row flex-space-between" key={index}>
              <label className="font-small no-select">{attr.key}</label>
              <span className="font-small">{attr.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
}

function balanceOrFaucetingIndication (account) {
  return {
    key: 'BALANCE',
    value: formatBalance(account.balance),
  }
}
