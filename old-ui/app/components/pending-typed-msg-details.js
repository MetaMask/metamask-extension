import React, {Component} from 'react'
import AccountPanel from './account-panel'
import TypedMessageRenderer from './typed-message-renderer'
import PropTypes from 'prop-types'

export default class PendingMsgDetails extends Component {
  static propTypes = {
    txData: PropTypes.object,
    selectedAddress: PropTypes.string,
    identities: PropTypes.object,
    accounts: PropTypes.array,
    imageifyIdenticons: PropTypes.any,
  }

  render () {
    const state = this.props
    const msgData = state.txData

    const msgParams = msgData.msgParams || {}
    const address = msgParams.from || state.selectedAddress
    const identity = state.identities[address] || { address: address }
    const account = state.accounts[address] || { address: address }

    const { data, version } = msgParams

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
