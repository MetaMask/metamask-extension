import EventEmitter from 'events'
import React, { useState, useEffect, useRef, useContext } from 'react'
import PropTypes from 'prop-types'
import { shuffle } from 'lodash'
import { I18nContext } from '../../../contexts/i18n'
import Mascot from '../../../components/ui/mascot'
import BackgroundAnimation from './background-animation'
import AggregatorLogo from './aggregator-logo'

const AGGREGATOR_LOCATION_MAP = {
  totle: { x: -125, y: -75 },
  dexag: { x: 30, y: -75 },
  uniswap: { x: -145, y: 0 },
  paraswap: { x: 50, y: 0 },
  '0x': { x: -135, y: 46 },
  '1inch': { x: 40, y: 46 },
}

const AGGREGATOR_NAMES = Object.keys(AGGREGATOR_LOCATION_MAP)

function getMascotTarget (quoteCount, centerPoint) {
  const location = AGGREGATOR_LOCATION_MAP[AGGREGATOR_NAMES[quoteCount]]

  if (!location || !centerPoint) {
    return centerPoint ?? {}
  }

  return {
    x: location.x + centerPoint.x + 47,
    y: location.y + centerPoint.y + 20,
  }
}

export default function LoadingSwapsQuotes ({
  loadingComplete,
  onDone,
}) {
  const t = useContext(I18nContext)
  const numberOfQuotes = Object.values(AGGREGATOR_NAMES).length
  const animationEventEmitter = useRef(new EventEmitter())
  const mascotContainer = useRef()
  const currentMascotContainer = mascotContainer.current

  const [quoteCount, updateQuoteCount] = useState(0)
  const [aggregatorNames] = useState(shuffle(AGGREGATOR_NAMES))
  const [midPointTarget, setMidpointTarget] = useState(null)

  useEffect(() => {
    let timeoutLength
    if (quoteCount === numberOfQuotes && loadingComplete) {
      timeoutLength = 1000
    } else if (loadingComplete) {
      timeoutLength = 300
    } else {
      timeoutLength = 300 + Math.floor(Math.random() * 1200)
    }
    const quoteCountTimeout = setTimeout(() => {
      if (quoteCount < numberOfQuotes) {
        updateQuoteCount(quoteCount + 1)
      } else if (quoteCount === numberOfQuotes && loadingComplete) {
        onDone()
      }
    }, timeoutLength)

    return function cleanup () {
      clearTimeout(quoteCountTimeout)
    }
  }, [quoteCount, loadingComplete, onDone, numberOfQuotes])

  useEffect(() => {
    if (currentMascotContainer) {
      const { top, left, width, height } = currentMascotContainer.getBoundingClientRect()
      const center = { x: left + (width / 2), y: top + (height / 2) }
      setMidpointTarget(center)
    }
  }, [currentMascotContainer])

  return (
    <div className="loading-swaps-quotes">
      <div className="loading-swaps-quotes__quote-counter">
        <span>{t('swapQuoteNofN', [quoteCount, numberOfQuotes])}</span>
      </div>
      <div className="loading-swaps-quotes__quote-name-check">
        <span>{quoteCount === numberOfQuotes ? t('swapFinalizing') : t('swapCheckingQuote', [aggregatorNames[quoteCount]])}</span>
      </div>
      <div className="loading-swaps-quotes__loading-bar-container">
        <div
          className="loading-swaps-quotes__loading-bar"
          style={{
            width: `${(100 / numberOfQuotes) * quoteCount}%`,
          }}
        />
      </div>
      <div className="loading-swaps-quotes__animation">
        <BackgroundAnimation />
        <div className="loading-swaps-quotes__mascot-container" ref={mascotContainer}>
          <Mascot
            animationEventEmitter={animationEventEmitter.current}
            width="90"
            height="90"
            followMouse={false}
            lookAtTarget={getMascotTarget(quoteCount, midPointTarget)}
          />
        </div>
        {currentMascotContainer && midPointTarget && AGGREGATOR_NAMES.map((aggName) => (
          <div
            className="loading-swaps-quotes__logo"
            style={{
              opacity: aggName === AGGREGATOR_NAMES[quoteCount] ? 1 : 0,
              top: AGGREGATOR_LOCATION_MAP[aggName]?.y + midPointTarget?.y ?? 0,
              left: AGGREGATOR_LOCATION_MAP[aggName]?.x + midPointTarget?.x ?? 0,
            }}
            key={`aggregator-logo-${aggName}`}
          >
            <AggregatorLogo aggregatorName={aggName} />
          </div>
        ))}
      </div>
    </div>
  )
}

LoadingSwapsQuotes.propTypes = {
  loadingComplete: PropTypes.bool.isRequired,
  onDone: PropTypes.func.isRequired,
}
