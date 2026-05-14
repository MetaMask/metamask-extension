import { useEffect, useState } from 'react';

const DEFAULT_FUNDING_COUNTDOWN = '01:00:00';

/**
 * Calculate the funding countdown string until the next UTC hour.
 *
 * @returns Formatted countdown string, e.g. "00:23:45".
 */
export function calculateFundingCountdown(): string {
  const now = new Date();
  let minutesRemaining = 59 - now.getUTCMinutes();
  let secondsRemaining = 60 - now.getUTCSeconds();

  if (secondsRemaining === 60) {
    secondsRemaining = 0;
    minutesRemaining += 1;
  }

  if (minutesRemaining === 60) {
    return DEFAULT_FUNDING_COUNTDOWN;
  }

  return `00:${String(minutesRemaining).padStart(2, '0')}:${String(
    secondsRemaining,
  ).padStart(2, '0')}`;
}

/**
 * Returns a live funding countdown string, updated every second.
 *
 * @returns Formatted countdown string, e.g. "00:23:45".
 */
export function useFundingCountdown(): string {
  const [countdown, setCountdown] = useState(calculateFundingCountdown);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateFundingCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}
