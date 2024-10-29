import { useEffect, useRef, useState } from 'react';

type UseMultiPollingOptions<PollingInput> = {
  startPolling: (input: PollingInput) => Promise<string>;
  stopPollingByPollingToken: (pollingToken: string) => void;
  input: PollingInput[];
};

// Version of ui/hooks/usePolling.ts that supports multiple inputs / polling loops
const useMultiPolling = <PollingInput>(
  usePollingOptions: UseMultiPollingOptions<PollingInput>,
) => {
  const [polls, setPolls] = useState(new Map());

  useEffect(() => {
    // start new polls
    for (const input of usePollingOptions.input) {
      const key = JSON.stringify(input);
      if (!polls.has(key)) {
        usePollingOptions
          .startPolling(input)
          .then((token) =>
            setPolls((prevPolls) => new Map(prevPolls).set(key, token)),
          );
      }
    }

    // stop existing polls
    for (const [inputKey, token] of polls.entries()) {
      const exists = usePollingOptions.input.some(
        (i) => inputKey === JSON.stringify(i),
      );

      if (!exists) {
        usePollingOptions.stopPollingByPollingToken(token);
        setPolls((prevPolls) => {
          const newPolls = new Map(prevPolls);
          newPolls.delete(inputKey);
          return newPolls;
        });
      }
    }
  }, [usePollingOptions.input && JSON.stringify(usePollingOptions.input)]);

  // stop all polling on dismount
  useEffect(() => {
    return () => {
      for (const token of polls.values()) {
        usePollingOptions.stopPollingByPollingToken(token);
      }
    };
  }, []);
};

export default useMultiPolling;
