import React from 'react'
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
