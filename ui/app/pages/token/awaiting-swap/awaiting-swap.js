import EventEmitter from 'events'
import React, { useContext, useRef } from 'react'
import PropTypes from 'prop-types'
import { I18nContext } from '../../../contexts/i18n'
import Mascot from '../../../components/ui/mascot'
import PulseLoader from '../../../components/ui/pulse-loader'
import { getBlockExplorerUrlForTx } from '../../../helpers/utils/transactions.util'
import SwapFailureIcon from './swap-failure-icon'
import SwapSuccessIcon from './swap-success-icon'

export default function AwaitingSwap ({
  swapComplete,
  swapError,
  symbol,
  estimatedTime,
  networkId,
  txHash,
}) {
  const t = useContext(I18nContext)
  const animationEventEmitter = useRef(new EventEmitter())

  const getHeader = () => {
    if (swapError) {
      return t('swapSwapError')
    } else if (!swapComplete) {
      return t('swapProcessing')
    }
    return t('swapTransactionComplete')

  }

  const getStatusImage = () => {
    if (swapError) {
      return <SwapFailureIcon />
    }
    if (swapComplete) {
      return <SwapSuccessIcon />
    }
    if (!swapComplete) {
      return <PulseLoader />
    }
    return undefined
  }

  const getDescription = () => {
    if (swapError) {
      return t('swapErrorDescription')
    }
    if (swapComplete) {
      return t('swapOnceTransactionHasProcess', [symbol])
    }
    if (!swapComplete) {
      return t('swapTokenAvailable', [symbol])
    }
    return undefined
  }

  return (
    <div className="awaiting-swap">
      {!(swapComplete || swapError) && (
        <Mascot
          animationEventEmitter={animationEventEmitter.current}
          width="90"
          height="90"
        />
      )
      }
      <div className="awaiting-swap__status-image">
        {getStatusImage()}
      </div>
      <div className="awaiting-swap__header">
        {getHeader()}
      </div>
      <div className="awaiting-swap__main-descrption">
        {getDescription()}
      </div>
      {!(swapComplete || swapError) && (
        <div className="awaiting-swap__time-estimate">
          {t('swapEstimatedTimeFull', [
            <span className="bold" key="swapEstimatedTime-1">{t('swapEstimatedTime')}</span>,
            estimatedTime || t('swapEstimatedTimeCalculating'),
          ])}
        </div>
      )}
      <div
        className="awaiting-swap__view-on-etherscan"
        onClick={() => global.platform.openTab({ url: getBlockExplorerUrlForTx(networkId, txHash) })}
      >
        {t('viewOnEtherscan')}
      </div>
    </div>
  )
}

AwaitingSwap.propTypes = {
  swapComplete: PropTypes.bool,
  swapError: PropTypes.bool,
  symbol: PropTypes.string.isRequired,
  estimatedTime: PropTypes.string,
  networkId: PropTypes.string,
  txHash: PropTypes.string,
}
