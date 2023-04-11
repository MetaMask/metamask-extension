import base32Encode from 'base32-encode';
import base64 from 'base64-js';
import browser from 'webextension-polyfill';
import { udTlds as supportedUnsTopLevelDomains } from '@unstoppabledomains/tldsresolverkeys';

import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import resolveEnsToIpfsContentId from './ens-resolver';
import resolveUnsToIpfsContentId from './uns-resolver';

const fetchWithTimeout = getFetchWithTimeout();
const supportedEnsTopLevelDomains = ['eth'];
const combinedSupportedTlds = supportedUnsTopLevelDomains.concat(
  supportedEnsTopLevelDomains,
);

export default function setupIpfsResolver({
  provider,
  getCurrentChainId,
  getIpfsGateway,
}) {
  // install listener
  const urlPatterns = combinedSupportedTlds.map((tld) => `*://*.${tld}/*`);
  browser.webRequest.onErrorOccurred.addListener(webRequestDidFail, {
    urls: urlPatterns,
    types: ['main_frame'],
  });

  // return api object
  return {
    // uninstall listener
    remove() {
      browser.webRequest.onErrorOccurred.removeListener(webRequestDidFail);
    },
  };

  async function webRequestDidFail(details) {
    const { tabId, url } = details;
    // ignore requests that are not associated with tabs
    // only attempt resolution on mainnet
    if (tabId === -1 || getCurrentChainId() !== '0x1') {
      return;
    }
    // parse domain name
    const { hostname: name, pathname, search, hash: fragment } = new URL(url);
    const domainParts = name.split('.');
    const topLevelDomain = domainParts[domainParts.length - 1];
    // if supported ENS TLD, attempt resolve ENS
    if (supportedEnsTopLevelDomains.includes(topLevelDomain)) {
      attemptResolveEns({ tabId, name, pathname, search, fragment });
    } else {
      // otherwise attempt resolve UNS
      attemptResolveUns(tabId, name);
    }
  }
  /**
   *  Checks for an IPFS site under an Unstoppable Domain,
   *  If the site exists, it will redirect to it, otherwise it redirects to the UD search page with the given domain
   *
   * @param {number} tabId - from browser
   * @param {string} domainName - entered domain name
   */
  async function attemptResolveUns(tabId, domainName) {
    const ipfsGateway = getIpfsGateway();
    browser.tabs.update(tabId, { url: `unsLoading.html` });
    let url = `https://unstoppabledomains.com/search?searchTerm=${domainName}`;
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

  async function attemptResolveEns({
    tabId,
    name,
    pathname,
    search,
    fragment,
  }) {
    const ipfsGateway = getIpfsGateway();
    browser.tabs.update(tabId, { url: `ensLoading.html` });
    let url = `https://app.ens.domains/name/${name}`;
    try {
      const { type, hash } = await resolveEnsToIpfsContentId({
        provider,
        name,
      });
      if (type === 'ipfs-ns' || type === 'ipns-ns') {
        const resolvedUrl = `https://${hash}.${type.slice(
          0,
          4,
        )}.${ipfsGateway}${pathname}${search || ''}${fragment || ''}`;
        try {
          // check if ipfs gateway has result
          const response = await fetchWithTimeout(resolvedUrl, {
            method: 'HEAD',
          });
          if (response.status === 200) {
            url = resolvedUrl;
          }
        } catch (err) {
          console.warn(err);
        }
      } else if (type === 'swarm-ns') {
        url = `https://swarm-gateways.net/bzz:/${hash}${pathname}${
          search || ''
        }${fragment || ''}`;
      } else if (type === 'onion' || type === 'onion3') {
        url = `http://${hash}.onion${pathname}${search || ''}${fragment || ''}`;
      } else if (type === 'zeronet') {
        url = `http://127.0.0.1:43110/${hash}${pathname}${search || ''}${
          fragment || ''
        }`;
      } else if (type === 'skynet-ns') {
        const padded = hash.padEnd(hash.length + 4 - (hash.length % 4), '=');
        const decoded = base64.toByteArray(padded);

        const options = { padding: false };
        const base32EncodedSkylink = base32Encode(
          decoded,
          'RFC4648-HEX',
          options,
        ).toLowerCase();
        url = `https://${base32EncodedSkylink}.siasky.net${pathname}${
          search || ''
        }${fragment || ''}`;
      }
    } catch (err) {
      console.warn(err);
    } finally {
      browser.tabs.update(tabId, { url });
    }
  }
}
