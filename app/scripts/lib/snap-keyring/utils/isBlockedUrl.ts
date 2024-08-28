import { PhishingController } from '@metamask/phishing-controller';
import { isProtocolAllowed } from '../keyring-snaps-permissions';

/**
 * Checks whether a given URL is blocked due to not using HTTPS or being
 * recognized as a phishing URL.
 *
 * @param url - The URL to check.
 * @param maybeUpdateState - A function that updates the phishing controller state.
 * @param testOrigin - A function that tests if a URL is a phishing URL.
 * @returns Returns a promise which resolves to `true` if the URL is blocked
 * either due to using an insecure protocol (not HTTPS) or being recognized as
 * a phishing URL. Otherwise, resolves to `false`.
 */
export const isBlockedUrl = async (
  url: string,
  maybeUpdateState: () => ReturnType<PhishingController['maybeUpdateState']>,
  testOrigin: (url: string) => ReturnType<PhishingController['test']>,
): Promise<boolean> => {
  try {
    // check if the URL is HTTPS
    if (!isProtocolAllowed(url)) {
      return true;
    }

    // check if the url is in the phishing list
    await maybeUpdateState();
    return testOrigin(url).result;
  } catch (error) {
    console.error('Invalid URL passed into snap-keyring:', error);
    return false;
  }
};

/**
 * Checks weather a given URL is blocked due to making a network request to a
 * known C2 domain.
 *
 * @param url - The URL to check.
 * @param maybeUpdateState - A function that updates the phishing controller state.
 * @param testC2Domain - A function that tests if a URL is a known malicious C2 domain.
 * @returns Returns a promise which resolves to `true` if the URL is blocked
 * due to making a network request to a known malicious C2 domain. Otherwise,
 * resolves to `false`.
 */
export const isC2DomainBlocked = async (
  url: string,
  maybeUpdateState: () => ReturnType<PhishingController['maybeUpdateState']>,
  testC2Domain: (
    url: string,
  ) => ReturnType<PhishingController['isBlockedRequest']>,
): Promise<boolean> => {
  try {
    // check if the url is in the phishing list
    await maybeUpdateState();
    return testC2Domain(url).result;
  } catch (error) {
    console.error('Invalid URL passed into snap-keyring:', error);
    return false;
  }
};
