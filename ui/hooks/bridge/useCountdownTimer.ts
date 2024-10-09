import { Duration } from 'luxon';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../ducks/bridge/selectors';
import { REFRESH_INTERVAL_MS } from '../../../app/scripts/controllers/bridge/constants';

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
      setTimeRemaining(Math.max(0, timeRemaining - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining]);

  return Duration.fromMillis(timeRemaining).toFormat('m:ss');
};
