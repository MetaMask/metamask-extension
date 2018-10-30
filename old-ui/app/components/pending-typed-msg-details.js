import React, {Component} from 'react'
import AccountPanel from './account-panel'
import TypedMessageRenderer from './typed-message-renderer'

export default class PendingMsgDetails extends Component {
  render () {
    var state = this.props
    var msgData = state.txData

    var msgParams = msgData.msgParams || {}
    var address = msgParams.from || state.selectedAddress
    var identity = state.identities[address] || { address: address }
    var account = state.accounts[address] || { address: address }

    var { data, version } = msgParams

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
        <div style={{
          height: '260px',
          margin: '0 30px',
        }}>
          <label className="font-small" style={{
            display: 'block',
            color: 'white',
            margin: '10px 0',
          }}>YOU ARE SIGNING</label>
          <TypedMessageRenderer
            value={data}
            version={version}
            style={{
              height: '215px',
            }}
          />
        </div>
      </div>
    )
  }
}
