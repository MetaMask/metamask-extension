import { useEffect, useState } from "react";
import { getPhishingResult } from "../../store/actions";
import { EthPhishingDetectResult } from "@metamask/phishing-controller";


/**
 * Perform a phishing check on the provided link.
 * @param website - The website to check.
 * @returns The safe website URL or nothing if it's a phishing website.
 */
export const useSafeWebsite = (website: string) => {
  const [safeWebsite, setSafeWebsite] = useState<URL>();

  useEffect(() => {
    const performPhishingCheck = async () => {
      const phishingResult = await getPhishingResult(website) as EthPhishingDetectResult;

      if (!phishingResult.result) {
        setSafeWebsite(new URL(website));
      }
    };
    if (website) {
      performPhishingCheck();
    }
  }, [website]);

  return safeWebsite
}