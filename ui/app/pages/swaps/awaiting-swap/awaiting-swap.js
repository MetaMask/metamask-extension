import EventEmitter from 'events'
import React, { useContext, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { I18nContext } from '../../../contexts/i18n'
import Mascot from '../../../components/ui/mascot'
import PulseLoader from '../../../components/ui/pulse-loader'
import { getBlockExplorerUrlForTx } from '../../../helpers/utils/transactions.util'
import CountdownTimer from '../countdown-timer'
import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
} from '../../../helpers/constants/swaps'
import SwapFailureIcon from './swap-failure-icon'
import SwapSuccessIcon from './swap-success-icon'
import QuotesTimeoutIcon from './quotes-timeout-icon'
import SwapsFooter from '../swaps-footer'

export default function AwaitingSwap ({
  swapComplete,
  errorKey,
  symbol,
  txHash,
  networkId,
  tokensReceived,
  submittedTime,
  estimatedTransactionWaitTime,
  rpcPrefs,
  onSubmit,
}) {
  const t = useContext(I18nContext)
  const animationEventEmitter = useRef(new EventEmitter())

  let headerText
  let statusImage
  let descriptionText
  let submitText

 t( if (errorKey === SWAP_FAILED_ERROR) {)
    headerText = t('swapFailedErrorTitle')
    descriptionText = t('swapFailedErrorDescription')
    submitText = t('tryAgain')
    statusImage = <SwapFailureIcon />
  } else if (errorKey === QUOTES_EXPIRED_ERROR) {
    headerText = t('swapQuotesExpiredErrorTitle')
    descriptionText = t('swapQuotesExpiredErrorDescription')
    submitText = t('tryAgain')
    statusImage = <QuotesTimeoutIcon />
  } else if (errorKey === ERROR_FETCHING_QUOTES) {
    headerText = t('swapFetchingQuotesErrorTitle')
    descriptionText = t('swapFetchingQuotesErrorDescription')
    submitText = t('back')
    statusImage = <SwapFailureIcon />
  } else if (errorKey === QUOTES_NOT_AVAILABLE_ERROR) {
    headerText = t('swapQuotesNotAvailableErrorTitle')
    descriptionText = t('swapQuotesNotAvailableErrorDescription')
    submitText = t('tryAgain')
    statusImage = <SwapFailureIcon />
  } else if (!errorKey && !swapComplete) {
    headerText = t('swapProcessing')
    statusImage = <PulseLoader />
    submitText = t('close')
    descriptionText = t('swapOnceTransactionHasProcess', [<span key="swapOnceTransactionHasProcess-1" className="awaiting-swap__amount-and-symbol">{symbol}</span>])
  } else if (!errorKey && swapComplete) {
    headerText = t('swapTransactionComplete')
    statusImage = <SwapSuccessIcon />
    submitText = t('swapViewToken', [symbol])
    descriptionText = t('swapTokenAvailable', [<span key="swapTokenAvailable-2" className="awaiting-swap__amount-and-symbol">{`${tokensReceived} ${symbol}`}</span>])
  }

  const blockExplorerUrl = getBlockExplorerUrlForTx(networkId, txHash, rpcPrefs)
  const showBlockExplorterLink = blockExplorerUrl && (!errorKey || errorKey === SWAP_FAILED_ERROR)

  return (
    <div className="awaiting-swap">
      <div className="awaiting-swap__content">
        {!(swapComplete || errorKey) && (
          <Mascot
            animationEventEmitter={animationEventEmitter.current}
            width="90"
            height="90"
          />
        )}
        <div className="awaiting-swap__status-image">
          {statusImage}
        </div>
        <div className="awaiting-swap__header">
          {headerText}
        </div>
        <div className="awaiting-swap__main-descrption">
          {descriptionText}
        </div>
        {!(swapComplete || errorKey) && (
          <div className="awaiting-swap__time-estimate">
            {t('swapEstimatedTimeFull', [
              <span className="awaiting-swap__time-estimate-text" key="swapEstimatedTime-1">{t('swapEstimatedTime')}</span>,
              estimatedTransactionWaitTime || estimatedTransactionWaitTime === 0
                ? <CountdownTimer timeStarted={submittedTime} timerBase={estimatedTransactionWaitTime} timeOnly />
                : t('swapEstimatedTimeCalculating'),
            ])}
          </div>
        )}
        {showBlockExplorterLink && (
          <div
            className={classnames('awaiting-swap__view-on-etherscan', {
              'awaiting-swap__view-on-etherscan--visible': txHash,
              'awaiting-swap__view-on-etherscan--invisible': !txHash,
            })}
            onClick={() => global.platform.openTab({ url: blockExplorerUrl })}
          >
            {rpcPrefs.blockExplorerUrl ? t('viewOnCustomBlockExplorer', [blockExplorerUrl]) : t('viewOnEtherscan')}
          </div>
        )}
      </div>
      <SwapsFooter
        onSubmit={onSubmit}
        submitText={submitText}
        hideCancel
      />
    </div>
  )
}

AwaitingSwap.propTypes = {
  swapComplete: PropTypes.bool,
  symbol: PropTypes.string.isRequired,
  networkId: PropTypes.string.isRequired,
  txHash: PropTypes.string.isRequired,
  submittedTime: PropTypes.number,
  estimatedTransactionWaitTime: PropTypes.number,
  tokensReceived: PropTypes.string,
  rpcPrefs: PropTypes.object.isRequired,
  errorKey: PropTypes.oneOf([
    QUOTES_EXPIRED_ERROR,
    SWAP_FAILED_ERROR,
    ERROR_FETCHING_QUOTES,
    QUOTES_NOT_AVAILABLE_ERROR,
  ]),
}
