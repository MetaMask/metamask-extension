import { useEffect, useState, useRef } from 'react';
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

  const [timeRemaining, setTimeRemaining] = useState(refreshRate);
  const timeRemainingRef = useRef(refreshRate);

  // Update ref whenever timeRemaining changes
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    if (quotesLastFetchedMs) {
      setTimeRemaining(refreshRate - (Date.now() - quotesLastFetchedMs) + STEP);
    }
  }, [quotesLastFetchedMs, refreshRate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(Math.max(0, timeRemainingRef.current - STEP));
    }, STEP);
    return () => clearInterval(interval);
  }, []);

  return Math.floor(timeRemaining / 1000);
};
