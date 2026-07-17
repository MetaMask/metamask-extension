import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getQuoteRefreshRate,
} from '../../ducks/bridge/selectors';

const STEP = 1000;
/**
 * Custom hook that provides a countdown timer based on the last fetched quotes timestamp.
 *
 * This hook calculates the remaining time until the next refresh interval and updates every second.
 *
 * @returns The remaining time in seconds.
 */
export const useCountdownTimer = () => {
  const { quotesLastFetchedMs } = useSelector(getBridgeQuotes);
  const refreshRate = useSelector(getQuoteRefreshRate);

  const [timeRemaining, setTimeRemaining] = useState(refreshRate + STEP);

  useEffect(() => {
    if (quotesLastFetchedMs) {
      setTimeRemaining(refreshRate - (Date.now() - quotesLastFetchedMs) + STEP);
    }
  }, [quotesLastFetchedMs, refreshRate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - STEP));
    }, STEP);
    return () => clearInterval(interval);
  }, []);

  return Math.floor(timeRemaining / 1000);
};
