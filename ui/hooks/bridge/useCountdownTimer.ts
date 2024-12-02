import { Duration } from 'luxon';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getBridgeQuotesConfig,
} from '../../ducks/bridge/selectors';
import { SECOND } from '../../../shared/constants/time';

/**
 * Custom hook that provides a countdown timer based on the last fetched quotes timestamp.
 *
 * This hook calculates the remaining time until the next refresh interval and updates every second.
 *
 * @returns The formatted remaining time in 'm:ss' format.
 */
export const useCountdownTimer = () => {
  const { quotesLastFetchedMs } = useSelector(getBridgeQuotes);
  const { refreshRate } = useSelector(getBridgeQuotesConfig);

  const [timeRemaining, setTimeRemaining] = useState(refreshRate);

  useEffect(() => {
    if (quotesLastFetchedMs) {
      setTimeRemaining(
        refreshRate - (Date.now() - quotesLastFetchedMs) + SECOND,
      );
    }
  }, [quotesLastFetchedMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(Math.max(0, timeRemaining - SECOND));
    }, SECOND);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  return Duration.fromMillis(timeRemaining).toFormat('m:ss');
};
