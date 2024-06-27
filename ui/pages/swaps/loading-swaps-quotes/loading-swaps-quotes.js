import EventEmitter from 'events';
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { shuffle } from 'lodash';
import { useHistory } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import {
  navigateBackToBuildQuote,
  getFetchParams,
  getQuotesFetchStartTime,
  getCurrentSmartTransactionsEnabled,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import {
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
} from '../../../../shared/modules/selectors';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import Mascot from '../../../components/ui/mascot';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import SwapsFooter from '../swaps-footer';
import { Text } from '../../../components/component-library';
import {
  TextVariant,
  TextColor,
  BlockSize,
  Display,
  JustifyContent,
  TextTransform,
} from '../../../helpers/constants/design-system';
import BackgroundAnimation from './background-animation';

export default function LoadingSwapsQuotes({
  aggregatorMetadata,
  loadingComplete,
  onDone,
}) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const history = useHistory();
  const animationEventEmitter = useRef(new EventEmitter());

  const fetchParams = useSelector(getFetchParams, isEqual);
  const quotesFetchStartTime = useSelector(getQuotesFetchStartTime);
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const quotesRequestCancelledEventConfig = {
    event: 'Quotes Request Cancelled',
    category: MetaMetricsEventCategory.Swaps,
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
      stx_enabled: smartTransactionsEnabled,
      current_stx_enabled: currentSmartTransactionsEnabled,
      stx_user_opt_in: smartTransactionsOptInStatus,
    },
  };

  const [aggregatorNames] = useState(() =>
    shuffle(Object.keys(aggregatorMetadata)),
  );
  const numberOfQuotes = aggregatorNames.length;
  const mascotContainer = useRef();
  const currentMascotContainer = mascotContainer.current;

  const [quoteCount, updateQuoteCount] = useState(0);
  const [midPointTarget, setMidpointTarget] = useState(null);

  useEffect(() => {
    let timeoutLength;

    // The below logic simulates a sequential loading of the aggregator quotes, even though we are fetching them all with a single call.
    // This is to give the user a sense of progress. The callback passed to `setTimeout` updates the quoteCount and therefore causes
    // a new logo to be shown, the fox to look at that logo, the logo bar and aggregator name to update.

    if (loadingComplete) {
      // If loading is complete, but the quoteCount is not, we quickly display the remaining logos/names/fox looks. 0.2s each
      timeoutLength = 20;
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
      const { top, left, width, height } =
        currentMascotContainer.getBoundingClientRect();
      const center = { x: left + width / 2, y: top + height / 2 };
      setMidpointTarget(center);
    }
  }, [currentMascotContainer]);

  return (
    <div className="loading-swaps-quotes">
      <div className="loading-swaps-quotes__content">
        <>
          <Text
            variant={TextVariant.bodyXs}
            data-testid="loading-swaps-quotes-quote-counter"
            color={TextColor.textAlternative}
            marginTop={1}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            width={BlockSize.Full}
            marginBottom={1}
          >
            <span>
              {t('swapFetchingQuoteNofN', [
                Math.min(quoteCount + 1, numberOfQuotes),
                numberOfQuotes,
              ])}
            </span>
          </Text>
          <Text
            variant={TextVariant.headingSm}
            data-testid="loading-swaps-quotes-quote-name-check"
            color={TextColor.textDefault}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            width={BlockSize.Full}
            textTransform={TextTransform.Capitalize}
          >
            <span>{t('swapFetchingQuotes')}</span>
          </Text>
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
              lookAtTarget={midPointTarget}
            />
          </div>
        </div>
      </div>
      <SwapsFooter
        submitText={t('back')}
        onSubmit={async () => {
          trackEvent(quotesRequestCancelledEventConfig);
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
      title: PropTypes.string,
      color: PropTypes.string,
      icon: PropTypes.string,
    }),
  ),
};
