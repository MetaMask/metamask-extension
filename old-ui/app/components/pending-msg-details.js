import React, {Component} from 'react'
import AccountPanel from './account-panel'
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

