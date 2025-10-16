import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';

type UseMultiPollingOptions<PollingInput> = {
  startPolling: (input: PollingInput) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  input: PollingInput[];
};

// A hook that manages multiple polling loops of a polling controller.
// Callers provide an array of inputs, and the hook manages starting
// and stopping polling loops for each input.
const useMultiPolling = <PollingInput>(
  usePollingOptions: UseMultiPollingOptions<PollingInput>,
) => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const pollingTokens = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!completedOnboarding) {
      // don't start polling if no selected account or onboarding is not completed yet
      return;
    }

    // start new polls
    for (const input of usePollingOptions.input) {
      const key = JSON.stringify(input);
      if (!pollingTokens.current.has(key)) {
        usePollingOptions
          .startPolling(input)
          .then((token) => pollingTokens.current.set(key, token));
      }
    }

    // stop existing polls
    for (const [inputKey, token] of pollingTokens.current.entries()) {
      const exists = usePollingOptions.input.some(
        (i) => inputKey === JSON.stringify(i),
      );

      if (!exists) {
        usePollingOptions.stopPollingByPollingToken(token);
        pollingTokens.current.delete(inputKey);
      }
    }
  }, [
    completedOnboarding,
    usePollingOptions.input && JSON.stringify(usePollingOptions.input),
  ]);

  // stop all polling on dismount
  useEffect(() => {
    return () => {
      for (const token of pollingTokens.current.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
    };
  }, []);
};

export default useMultiPolling;
