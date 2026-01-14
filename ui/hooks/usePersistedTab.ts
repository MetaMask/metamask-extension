import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import browser from 'webextension-polyfill';
import { AccountOverviewTab } from '../../shared/constants/app-state';

const STORAGE_KEY = 'home-active-tab';

/**
 * Hook that syncs active tab state between URL params and browser.storage.local
 * This ensures tab selection persists even when the extension popup is closed/reopened
 */
export function usePersistedTab(
  defaultTab: AccountOverviewTab = 'tokens',
): [AccountOverviewTab, (tab: AccountOverviewTab) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as AccountOverviewTab | null;

  // On mount, restore from browser.storage if no URL param
  useEffect(() => {
    const initializeTab = async () => {
      if (!urlTab) {
        try {
          const result = await browser.storage.local.get(STORAGE_KEY);
          const savedTab = result[STORAGE_KEY] as
            | AccountOverviewTab
            | undefined;

          if (savedTab) {
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
    if (urlTab) {
      browser.storage.local
        .set({ [STORAGE_KEY]: urlTab })
        .catch((error) => console.error('Failed to persist tab:', error));
    }
  }, [urlTab]);

  const activeTab = urlTab || defaultTab;

  const setActiveTab = useCallback(
    (tab: AccountOverviewTab) => {
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
