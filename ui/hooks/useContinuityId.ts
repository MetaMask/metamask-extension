import log from 'loglevel';
import { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { useSelector } from 'react-redux';
import type { MetaMaskReduxState } from '../store/store';
import { getContinuityIdForTab } from '../selectors/selectors';

/**
 * Returns the continuity ID for the current extension tab, if available.
 * In non-tab contexts (popup, sidepanel, notification), this returns undefined.
 */
export function useContinuityId(): string | undefined {
  const [currentTabId, setCurrentTabId] = useState<number | undefined>();

  useEffect(() => {
    let active = true;

    const resolveCurrentTabId = async () => {
      try {
        const tab = await browser.tabs.getCurrent();
        if (active) {
          // the types are wrong at time of writing, `tab` _can_ be undefined
          // here, so we use `tab?.id`.
          setCurrentTabId(tab?.id);
        }
      } catch (error) {
        if (active) {
          setCurrentTabId(undefined);
        }
        // this shouldn't happen, but it'd be nice to log it for debugging
        // purposes if it does
        log.error('Failed to get current tab ID:', error);
      }
    };

    resolveCurrentTabId();

    return () => {
      active = false;
    };
  }, []);

  return useSelector((state) => {
    if (currentTabId) {
      return getContinuityIdForTab(state as MetaMaskReduxState, currentTabId);
    }
  });
}
