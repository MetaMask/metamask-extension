import { useState } from 'react';

export function useLoadingTime() {
  const [loadingStart] = useState(Date.now());
  const [loadingTime, setLoadingTime] = useState<number | undefined>();

  const setLoadingComplete = () => {
    if (loadingTime === undefined) {
      setLoadingTime((Date.now() - loadingStart) / 1000);
    }
  };
  return { loadingTime, setLoadingComplete };
}
