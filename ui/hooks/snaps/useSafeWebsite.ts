import type { PhishingDetectorResult } from '@metamask/phishing-controller';
import { useEffect, useState } from 'react';

import { getPhishingResult } from '../../store/actions';

/**
 * Perform a phishing check on the provided link.
 *
 * @param website - The website to check.
 * @returns The safe website URL or nothing if it's a phishing website.
 */
export const useSafeWebsite = (website: string) => {
  const [safeWebsite, setSafeWebsite] = useState<URL>();

  useEffect(() => {
    const performPhishingCheck = async () => {
      const phishingResult = (await getPhishingResult(
        website,
      )) as PhishingDetectorResult;

      if (!phishingResult.result) {
        setSafeWebsite(new URL(website));
      }
    };
    if (website) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      performPhishingCheck();
    }
  }, [website]);

  return safeWebsite;
};
