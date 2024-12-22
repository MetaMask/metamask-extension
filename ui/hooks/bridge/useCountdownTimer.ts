import { Duration } from 'luxon';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../ducks/bridge/selectors';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { REFRESH_INTERVAL_MS } from '../../../app/scripts/controllers/bridge/constants';
import { SECOND } from '../../../shared/constants/time';

/**
 * Custom hook that provides a countdown timer based on the last fetched quotes timestamp.
 *
 * This hook calculates the remaining time until the next refresh interval and updates every second.
 *
 * @returns The formatted remaining time in 'm:ss' format.
 */
export const useCountdownTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState(REFRESH_INTERVAL_MS);
  const { quotesLastFetchedMs } = useSelector(getBridgeQuotes);

  useEffect(() => {
    if (quotesLastFetchedMs) {
      setTimeRemaining(
        REFRESH_INTERVAL_MS - (Date.now() - quotesLastFetchedMs),
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
