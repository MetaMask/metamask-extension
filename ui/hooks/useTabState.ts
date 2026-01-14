import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { AccountOverviewTab } from '../../shared/constants/app-state';

const STORAGE_KEY = 'home-active-tab';

/**
 * Syncs active tab between URL params and browser storage to persist across sessions
 */
export function useTabState(defaultTab: AccountOverviewTab = 'tokens') {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!tab) {
      browser.storage.local
        .get(STORAGE_KEY)
        .then((result) => {
          const savedTab = result[STORAGE_KEY];
          if (savedTab) {
            setSearchParams({ tab: savedTab }, { replace: true });
          }
        })
        .catch((error) =>
          console.error('Failed to load persisted tab:', error),
        );
    }
  }, [tab, setSearchParams]);

  useEffect(() => {
    if (tab) {
      browser.storage.local
        .set({ [STORAGE_KEY]: tab })
        .catch((error) => console.error('Failed to persist tab:', error));
    }
  }, [tab]);

  const activeTab = (tab as AccountOverviewTab) || defaultTab;

  const setActiveTab = useCallback(
    (tab: AccountOverviewTab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams],
  );

  return [activeTab, setActiveTab] as const;
}
