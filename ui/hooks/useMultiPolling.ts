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

  const prevPollingInputStringified = useRef<string | null>(null);
  const hasPollingInputChanged =
    JSON.stringify(usePollingOptions.input) !==
    prevPollingInputStringified.current;

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      // stop all polling on dismount
      for (const token of pollingTokens.current.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
      prevPollingInputStringified.current = null;
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!completedOnboarding || !hasPollingInputChanged) {
      // don't start polling if no selected account, or onboarding is incomplete, or polling inputs haven't changed
      return;
    }

    // start new polls
    for (const input of usePollingOptions.input) {
      const key = JSON.stringify(input);
      if (!pollingTokens.current.has(key)) {
        usePollingOptions.startPolling(input).then((token) => {
          if (isMounted.current) {
            pollingTokens.current.set(key, token);
          }
        });
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

    prevPollingInputStringified.current = JSON.stringify(
      usePollingOptions.input,
    );
  }, [usePollingOptions, hasPollingInputChanged, completedOnboarding]);
};

export default useMultiPolling;
