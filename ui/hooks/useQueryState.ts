import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useQueryState(key: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key);

  const setValue = useCallback(
    (newValue: string | null) => {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (newValue === null) {
            newParams.delete(key);
          } else {
            newParams.set(key, newValue);
          }
          return newParams;
        },
        { replace: true },
      );
    },
    [key, setSearchParams],
  );

  return [value, setValue];
}

export function useCloseModals() {
  const [, setSearchParams] = useSearchParams();

  return useCallback(() => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('show');
        return newParams;
      },
      { replace: true },
    );
  }, [setSearchParams]);
}
