import React, {Component} from 'react'
import AccountPanel from './account-panel'

export default class PendingMsgDetails extends Component {
  render () {
    var state = this.props
    var msgData = state.txData

    var msgParams = msgData.msgParams || {}
    var address = msgParams.from || state.selectedAddress
    var identity = state.identities[address] || { address: address }
    var account = state.accounts[address] || { address: address }

    return (
      <div key={msgData.id} style={{margin: '10px 0px'}}>
        <AccountPanel
          showFullAddress={true}
          identity={identity}
          account={account}
          imageifyIdenticons={state.imageifyIdenticons}
          style={{
            background: 'transparent',
          }}
        />
        <div className="tx-data flex-column flex-justify-center flex-grow select-none" style={{
          margin: '0 30px',
        }}>
          <div className="flex-column flex-space-between">
            <label className="font-small" style={{color: 'white', margin: '10px 0'}}>MESSAGE</label>
            <span className="font-small" style={{color: 'white', wordBreak: 'break-word'}}>{msgParams.data}</span>
          </div>
        </div>
      </div>
    )
  }
}

