import EventEmitter from 'events';
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { shuffle } from 'lodash';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
import {
  navigateBackToBuildQuote,
  getFetchParams,
  getQuotesFetchStartTime,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics.new';
import Mascot from '../../../components/ui/mascot';
import SwapsFooter from '../swaps-footer';
import BackgroundAnimation from './background-animation';
import AggregatorLogo from './aggregator-logo';

// These locations reference where we want the top-left corner of the logo div to appear in relation to the
// centre point of the fox
const AGGREGATOR_LOCATIONS = [
  { x: -125, y: -75 },
  { x: 30, y: -75 },
  { x: -145, y: 0 },
  { x: 50, y: 0 },
  { x: -135, y: 46 },
  { x: 40, y: 46 },
];

function getRandomLocations(numberOfLocations) {
  const randomLocations = shuffle(AGGREGATOR_LOCATIONS);
  if (numberOfLocations <= AGGREGATOR_LOCATIONS.length) {
    return randomLocations.slice(0, numberOfLocations);
  }
  const numberOfExtraLocations =
    numberOfLocations - AGGREGATOR_LOCATIONS.length;
  return [...randomLocations, ...getRandomLocations(numberOfExtraLocations)];
}

function getMascotTarget(aggregatorName, centerPoint, aggregatorLocationMap) {
  const location = aggregatorLocationMap[aggregatorName];

  if (!location || !centerPoint) {
    return centerPoint ?? {};
  }

  // The aggregator logos are 94px x 40px. For the fox to look at the center of each logo, the target needs to be
  // the coordinates for the centre point of the fox + the desired top and left coordinates of the logo + half
  // the height and width of the logo.
  return {
    x: location.x + centerPoint.x + 47,
    y: location.y + centerPoint.y + 20,
  };
}

export default function LoadingSwapsQuotes({
  aggregatorMetadata,
  loadingComplete,
  onDone,
}) {
  const t = useContext(I18nContext);
  const metaMetricsEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const animationEventEmitter = useRef(new EventEmitter());

  const fetchParams = useSelector(getFetchParams);
  const quotesFetchStartTime = useSelector(getQuotesFetchStartTime);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const quotesRequestCancelledEventConfig = {
    event: 'Quotes Request Cancelled',
    category: 'swaps',
    sensitiveProperties: {
      token_from: fetchParams?.sourceTokenInfo?.symbol,
      token_from_amount: fetchParams?.value,
      request_type: fetchParams?.balanceError,
      token_to: fetchParams?.destinationTokenInfo?.symbol,
      slippage: fetchParams?.slippage,
      custom_slippage: fetchParams?.slippage !== 2,
      response_time: Date.now() - quotesFetchStartTime,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: hardwareWalletType,
    },
  };

  const [aggregatorNames] = useState(() =>
    shuffle(Object.keys(aggregatorMetadata)),
  );
  const numberOfQuotes = aggregatorNames.length;
  const mascotContainer = useRef();
  const currentMascotContainer = mascotContainer.current;

  const [quoteCount, updateQuoteCount] = useState(0);
  // is an array of randomized items from AGGREGATOR_LOCATIONS, containing
  // numberOfQuotes number of items it is randomized so that the order in
  // which the fox looks at locations is random
  const [aggregatorLocations] = useState(() =>
    getRandomLocations(numberOfQuotes),
  );
  const _aggregatorLocationMap = aggregatorNames.reduce(
    (nameLocationMap, name, index) => ({
      ...nameLocationMap,
      [name]: aggregatorLocations[index],
    }),
    {},
  );
  const [aggregatorLocationMap] = useState(_aggregatorLocationMap);
  const [midPointTarget, setMidpointTarget] = useState(null);

  useEffect(() => {
    let timeoutLength;

    // The below logic simulates a sequential loading of the aggregator quotes, even though we are fetching them all with a single call.
    // This is to give the user a sense of progress. The callback passed to `setTimeout` updates the quoteCount and therefore causes
    // a new logo to be shown, the fox to look at that logo, the logo bar and aggregator name to update.

    if (loadingComplete) {
      // If loading is complete, but the quoteCount is not, we quickly display the remaining logos/names/fox looks. 0.2s each
      timeoutLength = 200;
    } else {
      // If loading is not complete, we display remaining logos/names/fox looks at random intervals between 0.5s and 2s, to simulate the
      // sort of loading a user would experience in most async scenarios
      timeoutLength = 500 + Math.floor(Math.random() * 1500);
    }
    const quoteCountTimeout = setTimeout(() => {
      if (quoteCount < numberOfQuotes) {
        updateQuoteCount(quoteCount + 1);
      } else if (quoteCount === numberOfQuotes && loadingComplete) {
        onDone();
      }
    }, timeoutLength);

    return function cleanup() {
      clearTimeout(quoteCountTimeout);
    };
  }, [quoteCount, loadingComplete, onDone, numberOfQuotes]);

  useEffect(() => {
    if (currentMascotContainer) {
      const {
        top,
        left,
        width,
        height,
      } = currentMascotContainer.getBoundingClientRect();
      const center = { x: left + width / 2, y: top + height / 2 };
      setMidpointTarget(center);
    }
  }, [currentMascotContainer]);

  return (
    <div className="loading-swaps-quotes">
      <div className="loading-swaps-quotes__content">
        <>
          <div className="loading-swaps-quotes__quote-counter">
            <span>
              {t('swapQuoteNofN', [
                Math.min(quoteCount + 1, numberOfQuotes),
                numberOfQuotes,
              ])}
            </span>
          </div>
          <div className="loading-swaps-quotes__quote-name-check">
            <span>
              {quoteCount === numberOfQuotes
                ? t('swapFinalizing')
                : t('swapCheckingQuote', [
                    aggregatorMetadata[aggregatorNames[quoteCount]].title,
                  ])}
            </span>
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
        <div className="loading-swaps-quotes__animation">
          <BackgroundAnimation />
          <div
            className="loading-swaps-quotes__mascot-container"
            ref={mascotContainer}
          >
            <Mascot
              animationEventEmitter={animationEventEmitter.current}
              width="90"
              height="90"
              followMouse={false}
              lookAtTarget={getMascotTarget(
                aggregatorNames[quoteCount],
                midPointTarget,
                aggregatorLocationMap,
              )}
            />
          </div>
          {currentMascotContainer &&
            midPointTarget &&
            aggregatorNames.map((aggName) => (
              <div
                className={classnames('loading-swaps-quotes__logo', {
                  'loading-swaps-quotes__logo--transition':
                    aggName === aggregatorNames[quoteCount],
                })}
                style={{
                  opacity: aggName === aggregatorNames[quoteCount] ? 1 : 0,
                  top:
                    aggregatorLocationMap[aggName]?.y + midPointTarget?.y ?? 0,
                  left:
                    aggregatorLocationMap[aggName]?.x + midPointTarget?.x ?? 0,
                }}
                key={`aggregator-logo-${aggName}`}
              >
                <AggregatorLogo
                  aggregatorName={aggName}
                  icon={aggregatorMetadata[aggName]?.icon}
                  color={aggregatorMetadata[aggName]?.color}
                />
              </div>
            ))}
        </div>
      </div>
      <SwapsFooter
        submitText={t('back')}
        onSubmit={async () => {
          metaMetricsEvent(quotesRequestCancelledEventConfig);
          await dispatch(navigateBackToBuildQuote(history));
        }}
        hideCancel
      />
    </div>
  );
}

LoadingSwapsQuotes.propTypes = {
  loadingComplete: PropTypes.bool.isRequired,
  onDone: PropTypes.func.isRequired,
  aggregatorMetadata: PropTypes.objectOf(
    PropTypes.shape({
      color: PropTypes.string,
      icon: PropTypes.string,
    }),
  ),
};
