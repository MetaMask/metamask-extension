import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { AccountOverviewTabKey } from '../helpers/constants/home';

const STORAGE_KEY = 'home-active-tab';

/**
 * Hook that syncs active tab state between URL params and browser.storage.local
 * This ensures tab selection persists even when the extension popup is closed/reopened
 */
export function usePersistedTab(
  defaultTab: AccountOverviewTabKey = AccountOverviewTabKey.Tokens,
): [AccountOverviewTabKey, (tab: AccountOverviewTabKey) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as AccountOverviewTabKey | null;

  // On mount, restore from browser.storage if no URL param
  useEffect(() => {
    const initializeTab = async () => {
      if (!urlTab) {
        try {
          const result = await browser.storage.local.get(STORAGE_KEY);
          const savedTab = result[STORAGE_KEY] as AccountOverviewTabKey;

          if (
            savedTab &&
            Object.values(AccountOverviewTabKey).includes(savedTab)
          ) {
            // Restore saved tab to URL without adding to history
            setSearchParams({ tab: savedTab }, { replace: true });
          }
        } catch (error) {
          console.error('Failed to load persisted tab:', error);
        }
      }
    };

    initializeTab();
  }, []); // Only run on mount

  // Sync URL param changes to browser.storage
  useEffect(() => {
    if (urlTab && Object.values(AccountOverviewTabKey).includes(urlTab)) {
      browser.storage.local
        .set({ [STORAGE_KEY]: urlTab })
        .catch((error) => console.error('Failed to persist tab:', error));
    }
  }, [urlTab]);

  const activeTab =
    urlTab && Object.values(AccountOverviewTabKey).includes(urlTab)
      ? urlTab
      : defaultTab;

  const setActiveTab = useCallback(
    (tab: AccountOverviewTabKey) => {
      // Update URL param (replaces history entry instead of pushing)
      setSearchParams({ tab }, { replace: true });

      // Also save to browser.storage
      browser.storage.local
        .set({ [STORAGE_KEY]: tab })
        .catch((error) => console.error('Failed to persist tab:', error));
    },
    [setSearchParams],
  );

  return [activeTab, setActiveTab];
}
