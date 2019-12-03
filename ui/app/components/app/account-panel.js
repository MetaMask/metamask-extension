import React, { Component } from 'react'
const inherits = require('util').inherits
import Identicon from '../ui/identicon'
const formatBalance = require('../../helpers/utils/util').formatBalance
const addressSummary = require('../../helpers/utils/util').addressSummary

module.exports = AccountPanel


inherits(AccountPanel, Component)
function AccountPanel () {
  Component.call(this)
}

AccountPanel.prototype.render = function () {
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
        {panelState.attributes.map((attr) => (
          <div className="flex-row flex-space-between" key={'' + Math.round(Math.random() * 1000000)}>
            <label className="font-small no-select">{attr.key}</label>
            <span className="font-small">{attr.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function balanceOrFaucetingIndication (account) {
  return {
    key: 'BALANCE',
    value: formatBalance(account.balance),
  }
}
