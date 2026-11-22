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

  // Tick clock so remaining time can be derived during render without Date.now().
  // Lazy init is the supported way to seed an impure baseline once.
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, STEP);
    return () => clearInterval(interval);
  }, []);

  const timeRemaining = quotesLastFetchedMs
    ? Math.max(0, refreshRate - (now - quotesLastFetchedMs) + STEP)
    : refreshRate + STEP;

  return Math.floor(timeRemaining / 1000);
};
