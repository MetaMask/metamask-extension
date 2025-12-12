import { useState, useEffect } from 'react';

/**
 * Custom hook to check if the browser actually supports sidepanel.
 * Some browsers like Arc have the sidePanel API but it doesn't work properly.
 * This hook verifies by querying for sidepanel contexts.
 *
 * @returns boolean | null - true if supported, false if not, null while checking
 */
export const useBrowserSupportsSidePanel = (): boolean | null => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if chrome.runtime.getContexts exists
        if (!chrome?.runtime?.getContexts) {
          setIsSupported(false);
          return;
        }

        // Try to query for sidepanel contexts
        // On browsers that don't properly support sidepanel, this may fail or return unexpected results
        await chrome.runtime.getContexts({
          contextTypes: ['SIDE_PANEL' as chrome.runtime.ContextType],
        });

        // If we get here without error, the API works
        setIsSupported(true);
      } catch (error) {
        console.log('Browser does not support sidepanel:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  return isSupported;
};
