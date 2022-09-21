import browser from 'webextension-polyfill';
import { udTlds } from '@unstoppabledomains/tldsresolverkeys';
import { isValidUnstoppableDomainName } from '../../../../ui/helpers/utils/util';
import resolveUnsToIpfsContentId from './resolver';
/**
 * Initializes the Ipfs resolver
 *
 * @param {Function} getIpfsGateway - the user selected IpfsGateway determined in MetaMask settings
 */
export default async function setupUnsIpfsResolver({ getIpfsGateway }) {
  const urlPatterns = udTlds.map((tld) => `*://*.${tld}/`);
  browser.webRequest.onErrorOccurred.addListener(webRequestDidFail, {
    urls: urlPatterns,
    types: ['main_frame'],
  });
  return {
    remove() {
      browser.webRequest.onErrorOccurred.removeListener(webRequestDidFail);
    },
  };
  /**
   * Attempts to Resolve to IPFS if a web request fails
   * checks for Valid Unstoppable Domain
   * If valid, attempt to resolve
   *
   * @param {object} details - tabID and Url from the browser
   */
  async function webRequestDidFail(details) {
    const { tabId, url } = details;
    if (tabId === -1) {
      return;
    }
    const { hostname: name } = new URL(url);
    if (!isValidUnstoppableDomainName(name)) {
      return;
    }
    attemptResolve(tabId, name);
  }
  /**
   * Attempts to Resolve to IPFS
   * set the URL to the Unstoppable Domains search page
   * Calls resolution to determine an IPFS Hash
   * If an IPFS hash is returned by the resolution set the URL to the IPFS Gateway + the IPFS Hash
   * if no Ipfs hash, redirect users to the UD search page
   *
   * @param {string} tabId - browser tab ID
   * @param {string} domainName - UD domain name
   */
  async function attemptResolve(tabId, domainName) {
    const ipfsGateway = getIpfsGateway();
    browser.tabs.update(tabId, { url: `unsloading.html` });
    let url = `http://unstoppabledomains.com/search?searchTerm=${domainName}`;
    try {
      const ipfsHash = await resolveUnsToIpfsContentId(domainName);
      if (ipfsHash) {
        url = `https://${ipfsGateway}/ipfs/${ipfsHash}`;
      }
    } catch (err) {
      console.warn(err);
    } finally {
      browser.tabs.update(tabId, { url });
    }
  }
}
