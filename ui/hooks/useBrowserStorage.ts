import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';

export function useBrowserStorage<T = string>(key: string) {
  const hasStorage = Boolean(browser?.storage?.local);

  const [value, setValue] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(() => hasStorage);

  useEffect(() => {
    if (!browser?.storage?.local) {
      return;
    }

    let mounted = true;

    browser.storage.local
      .get(key)
      .then((result) => {
        if (mounted) {
          setValue(result[key]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [key]);

  const setStoredValue = (newValue: T) => {
    setValue(newValue);
    if (browser?.storage?.local) {
      browser.storage.local.set({ [key]: newValue }).catch(() => {
        // no-op
      });
    }
  };

  return { value, setValue: setStoredValue, loading };
}
