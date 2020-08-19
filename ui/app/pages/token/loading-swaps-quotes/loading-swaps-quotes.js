import EventEmitter from 'events'
import React, { useState, useEffect, useRef, useContext } from 'react'
import PropTypes from 'prop-types'
import { shuffle } from 'lodash'
import { I18nContext } from '../../../contexts/i18n'
import Mascot from '../../../components/ui/mascot'
import BackgroundAnimation from './background-animation'
import AggregatorLogo from './aggregator-logo'

const _aggregatorNames = ['totle', 'dexag', 'uniswap', 'paraswap', '0x', '1inch']
const _locations = [
  { x: -125, y: -75 },
  { x: 30, y: -75 },
  { x: -145, y: 0 },
  { x: 50, y: 0 },
  { x: -135, y: 46 },
  { x: 40, y: 46 },
]

export default function LoadingSwapsQuotes ({
  loadingComplete,
  onDone,
}) {
  const t = useContext(I18nContext)
  const numberOfQuotes = Object.values(_aggregatorNames).length
  const animationEventEmitter = useRef(new EventEmitter())
  const mascotContainer = useRef()
  const currentMascotContainer = mascotContainer.current

  const [quoteCount, updateQuoteCount] = useState(0)
  const [aggregatorNames] = useState(shuffle(_aggregatorNames))
  const [aggregatorNameLocationMap, setAggregatorNameLocationMap] = useState({})
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
  }, [quoteCount, aggregatorNames, loadingComplete, onDone, numberOfQuotes, midPointTarget])

  useEffect(() => {
    if (currentMascotContainer) {
      const { top, left, width, height } = currentMascotContainer.getBoundingClientRect()
      const center = { x: left + (width / 2), y: top + (height / 2) }
      setMidpointTarget(center)
      const newAggregatorNameLocationMap = _locations.reduce((acc, { x, y }, i) => ({
        ...acc,
        [_aggregatorNames[i]]: {
          x: center.x + x + 47,
          y: center.y + y + 20,
          absoluteX: center.x + x,
          absoluteY: center.y + y,
        },
      }), {})
      setAggregatorNameLocationMap(newAggregatorNameLocationMap)
    }
  }, [currentMascotContainer, aggregatorNames])

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
            width: `${String((100 / numberOfQuotes) * quoteCount)}%`,
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
            lookAtTarget={aggregatorNameLocationMap[aggregatorNames[quoteCount]] || midPointTarget || {}}
          />
        </div>
        {currentMascotContainer && _aggregatorNames.map((aggName) => (
          <div
            className="loading-swaps-quotes__logo"
            style={{
              opacity: aggName === aggregatorNames[quoteCount] ? 1 : 0,
              top: aggregatorNameLocationMap[aggName]?.absoluteY,
              left: aggregatorNameLocationMap[aggName]?.absoluteX,
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
