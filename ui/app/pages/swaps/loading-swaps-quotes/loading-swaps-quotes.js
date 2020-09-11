import EventEmitter from 'events'
import React, { useState, useEffect, useRef, useContext } from 'react'
import PropTypes from 'prop-types'
import { shuffle } from 'lodash'
import { I18nContext } from '../../../contexts/i18n'
import Mascot from '../../../components/ui/mascot'
import SwapsFooter from '../swaps-footer'
import BackgroundAnimation from './background-animation'
import AggregatorLogo from './aggregator-logo'

// These locations reference where we want the top-left corner of the logo div to appear in relation to the
// centre point of the fox
const AGGREGATOR_LOCATIONS = [
  { x: -125, y: -75 },
  { x: 30, y: -75 },
  { x: -145, y: 0 },
  { x: 50, y: 0 },
  { x: -135, y: 46 },
  { x: 40, y: 46 },
]
const randomLocations = shuffle([...AGGREGATOR_LOCATIONS])
AGGREGATOR_LOCATIONS.push(randomLocations[0])

const AGGREGATOR_NAMES = ['totle', 'dexag', 'airswap', 'paraswap', 'zeroExV1', 'oneInch', 'uniswap']

function getMascotTarget (aggregatorName, centerPoint, aggregatorLocationMap) {
  const location = aggregatorLocationMap[aggregatorName]

  if (!location || !centerPoint) {
    return centerPoint ?? {}
  }

  // The aggregator logos are 94px x 40px. For the fox to look at the center of each logo, the target needs to be
  // the coordinates for the centre point of the fox + the desired top and left coordinates of the logo + half
  // the height and width of the logo.
  return {
    x: location.x + centerPoint.x + 47,
    y: location.y + centerPoint.y + 20,
  }
}

export default function LoadingSwapsQuotes ({
  aggregatorMetadata,
  loadingComplete,
  onDone,
  onSubmit,
}) {
  const t = useContext(I18nContext)
  const numberOfQuotes = AGGREGATOR_NAMES.length
  const animationEventEmitter = useRef(new EventEmitter())
  const mascotContainer = useRef()
  const currentMascotContainer = mascotContainer.current

  const [quoteCount, updateQuoteCount] = useState(0)
  const [aggregatorNames] = useState(shuffle(AGGREGATOR_NAMES))
  const [aggregatorLocations] = useState(shuffle(AGGREGATOR_LOCATIONS))
  const _aggregatorLocationMap = aggregatorNames.reduce((nameLocationMap, name, index) => ({ ...nameLocationMap, [name]: aggregatorLocations[index] }), {})
  const [aggregatorLocationMap] = useState(_aggregatorLocationMap)
  const [midPointTarget, setMidpointTarget] = useState(null)
  const [doneCalled, setDoneCalled] = useState(false)

  useEffect(() => {
    let timeoutLength

    // The below logic simulates a sequential loading of the aggregator quotes, even though we are fetching them all with a single call.
    // This is to give the user a sense of progress. The callback passed to `setTimeout` updates the quoteCount and therefore causes
    // a new logo to be shown, the fox to look at that logo, the logo bar and aggregator name to update.

    // If loading is complete and all logos + aggregator names have been shown, give the user 1.2 seconds to read the
    // "Finalizing message" and prepare for the screen change
    if (quoteCount === numberOfQuotes && loadingComplete) {
      timeoutLength = 1200
    } else if (loadingComplete) {
      // If loading is complete, but the quoteCount is not, we quickly display the remaining logos/names/fox looks. 0.5s each
      timeoutLength = 500
    } else {
      // If loading is not complete, we display remaining logos/names/fox looks at random intervals between 0.5s and 2s, to simulate the
      // sort of loading a user would experience in most async scenarios
      timeoutLength = 500 + Math.floor(Math.random() * 1500)
    }
    const quoteCountTimeout = setTimeout(() => {
      if (quoteCount < numberOfQuotes) {
        updateQuoteCount(quoteCount + 1)
      } else if (quoteCount === numberOfQuotes && loadingComplete) {
        setDoneCalled(true)
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
      <div className="loading-swaps-quotes__content">
        {!doneCalled && (
          <>
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
          </>
        )}
        <div className="loading-swaps-quotes__animation">
          <BackgroundAnimation />
          <div className="loading-swaps-quotes__mascot-container" ref={mascotContainer}>
            <Mascot
              animationEventEmitter={animationEventEmitter.current}
              width="90"
              height="90"
              followMouse={false}
              lookAtTarget={getMascotTarget(aggregatorNames[quoteCount], midPointTarget, aggregatorLocationMap)}
            />
          </div>
          {currentMascotContainer && midPointTarget && aggregatorNames.map((aggName) => (
            <div
              className="loading-swaps-quotes__logo"
              style={{
                opacity: aggName === aggregatorNames[quoteCount] ? 1 : 0,
                top: aggregatorLocationMap[aggName]?.y + midPointTarget?.y ?? 0,
                left: aggregatorLocationMap[aggName]?.x + midPointTarget?.x ?? 0,
              }}
              key={`aggregator-logo-${aggName}`}
            >
              <AggregatorLogo aggregatorName={aggName} icon={aggregatorMetadata[aggName]?.icon} color={aggregatorMetadata[aggName]?.color} />
            </div>
          ))}
        </div>
      </div>
      <SwapsFooter
        submitText={t('back')}
        onSubmit={onSubmit}
        hideCancel
      />
    </div>
  )
}

LoadingSwapsQuotes.propTypes = {
  loadingComplete: PropTypes.bool.isRequired,
  onDone: PropTypes.func.isRequired,
  aggregatorMetadata: PropTypes.arrayOf(PropTypes.shape({
    color: PropTypes.string,
    icon: PropTypes.string,
  })),
  onSubmit: PropTypes.func.isRequired,
}
