import React from 'react'
import { number } from '@storybook/addon-knobs/react'
import AwaitingSwap from './awaiting-swap'

export default {
  title: 'AwaitingSwap',
}

export const swapNotComplete = () => (
  <div style={{ height: '528px', width: '357px', border: '1px solid grey' }}>
    <AwaitingSwap
      swapComplete={false}
      swapError={false}
      symbol="ABC"
      estimatedTime="2 minutes"
      networkId="1"
      txHash="0xnotATx"
      submittedTime={number('submittedTime', Date.now())}
      transactionTimeRemaining={number('transactionTimeRemaining', 120000)}
    />
  </div>
)

export const swapComplete = () => (
  <div style={{ height: '528px', width: '357px', border: '1px solid grey' }}>
    <AwaitingSwap
      swapComplete
      swapError={false}
      symbol="ABC"
      estimatedTime={null}
      tokensReceived={320.68}
      networkId="1"
      txHash="0xnotATx"
    />
  </div>
)

export const swapError = () => (
  <div style={{ height: '528px', width: '357px', border: '1px solid grey' }}>
    <AwaitingSwap
      swapComplete={false}
      swapError
      symbol="ABC"
      estimatedTime={null}
      networkId="1"
      txHash="0xnotATx"
    />
  </div>
)
