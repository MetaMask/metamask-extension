import React, { Component } from 'react'
import PendingTxDetails from './pending-msg-details'
import PropTypes from 'prop-types'

export default class PendingMsg extends Component {
  static propTypes = {
    txData: PropTypes.object,
    cancelMessage: PropTypes.function,
    signMessage: PropTypes.function,
  }

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
        <div className="error" style={{
          margin: '30px',
          width: 'auto',
        }}>
          Signing this message can have
          dangerous side effects. Only sign messages from
          sites you fully trust with your entire account.
          This dangerous method will be removed in a future version.
        </div>
        <PendingTxDetails {...state}/>
        <div className="flex-row flex-space-around" style={{
          marginRight: '30px',
          float: 'right',
          display: 'block',
        }}>
          <button style={{marginRight: '10px'}} onClick={state.cancelMessage}>Cancel</button>
          <button onClick={state.signMessage}>Sign</button>
        </div>
      </div>
    )
  }
}
