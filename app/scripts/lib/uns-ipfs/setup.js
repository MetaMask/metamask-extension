import browser from 'webextension-polyfill';
import {
  isValidUnstoppableDomainName,
  getUdTlds,
} from '../../../../ui/helpers/utils/util';
import resolveUnsToIpfsContentId from './resolver';

export default async function setupUnsIpfsResolver({ getIpfsGateway }) {
  const udTlds = await getUdTlds();
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

  async function webRequestDidFail(details) {
    const { tabId, url } = details;
    if (tabId === -1) {
      return;
    }
    const { hostname: name } = new URL(url);
    if (!isValidUnstoppableDomainName(name, udTlds)) {
      return;
    }
    attemptResolve({ tabId, name });
  }

  async function attemptResolve({ tabId, name }) {
    const ipfsGateway = getIpfsGateway();
    browser.tabs.update(tabId, { url: `unsloading.html` });
    let url = `http://unstoppabledomains.com/search?searchTerm=${name}`;
    try {
      const ipfsHash = await resolveUnsToIpfsContentId(name);
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
