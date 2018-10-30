import React, { Component } from 'react'
import PendingTxDetails from './pending-personal-msg-details'

export default class PendingMsg extends Component {
  render () {
    var state = this.props
    var msgData = state.txData

    return (
      <div key={msgData.id} style={{height: '100%'}}>
        <h3 style={{
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'white',
          margin: '20px',
        }}>Sign message</h3>
        <PendingTxDetails {...state}/>
        <div className="flex-row flex-space-around" style={{
          marginRight: '30px',
          float: 'right',
          display: 'block',
        }}>
          <button style={{marginRight: '10px'}} onClick={state.cancelPersonalMessage}>Cancel</button>
          <button onClick={state.signPersonalMessage}>Sign</button>
        </div>
      </div>
    )
  }
}
