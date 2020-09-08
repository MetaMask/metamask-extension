import React from 'react'
import { number, text, select } from '@storybook/addon-knobs/react'
import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
} from '../../../helpers/constants/swaps'
import AwaitingSwap from './awaiting-swap'

export default {
  title: 'AwaitingSwap',
}

export const swapNotComplete = () => (
  <div style={{ height: '528px', width: '357px', border: '1px solid grey' }}>
    <AwaitingSwap
      swapComplete={false}
      errorKey={select('Error types', [
        '',
        QUOTES_EXPIRED_ERROR,
        SWAP_FAILED_ERROR,
        ERROR_FETCHING_QUOTES,
        QUOTES_NOT_AVAILABLE_ERROR,
      ], '')}
      symbol="ABC"
      estimatedTime="2 minutes"
      networkId="1"
      txHash="0xnotATx"
      submittedTime={number('submittedTime', Date.now())}
      transactionTimeRemaining={number('transactionTimeRemaining', 120000)}
      rpcPrefs={{ blockExplorerUrl: text('blockExplorerUrl 1', 'http://example.com') }}
    />
  </div>
)

export const swapComplete = () => (
  <div style={{ height: '528px', width: '357px', border: '1px solid grey' }}>
    <AwaitingSwap
      swapComplete
      errorKey={select('Error types', [
        '',
        QUOTES_EXPIRED_ERROR,
        SWAP_FAILED_ERROR,
        ERROR_FETCHING_QUOTES,
        QUOTES_NOT_AVAILABLE_ERROR,
      ], '')}
      symbol="ABC"
      estimatedTime={null}
      tokensReceived={320.68}
      networkId="1"
      txHash="0xnotATx"
      rpcPrefs={{ blockExplorerUrl: text('blockExplorerUrl 2', 'http://example.com') }}
    />
  </div>
)

export const swapError = () => (
  <div style={{ height: '528px', width: '357px', border: '1px solid grey' }}>
    <AwaitingSwap
      swapComplete={false}
      errorKey={select('Error types', [
        '',
        QUOTES_EXPIRED_ERROR,
        SWAP_FAILED_ERROR,
        ERROR_FETCHING_QUOTES,
        QUOTES_NOT_AVAILABLE_ERROR,
      ], '')}
      symbol="ABC"
      estimatedTime={null}
      networkId="1"
      txHash="0xnotATx"
      rpcPrefs={{ blockExplorerUrl: text('blockExplorerUrl 3', 'http://example.com') }}
    />
  </div>
)
