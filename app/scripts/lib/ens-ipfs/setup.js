import base32Encode from 'base32-encode';
import base64 from 'base64-js';
import browser from 'webextension-polyfill';

import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import resolveEnsToIpfsContentId from './resolver';

const fetchWithTimeout = getFetchWithTimeout();

const supportedTopLevelDomains = ['eth'];

export default function setupEnsIpfsResolver({
  provider,
  getCurrentChainId,
  getIpfsGateway,
  getUseAddressBarEnsResolution,
}) {
  // install listener
  const urlPatterns = supportedTopLevelDomains.map((tld) => `*://*.${tld}/*`);
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
    // only attempt ENS resolution on mainnet
    if (
      (tabId === -1 || getCurrentChainId() !== '0x1') &&
      // E2E tests use a chain other than 0x1, so for testing,
      // allow the reuqest to pass through
      !process.env.IN_TEST
    ) {
      return;
    }
    // parse ens name
    const { hostname: name, pathname, search, hash: fragment } = new URL(url);
    const domainParts = name.split('.');
    const topLevelDomain = domainParts[domainParts.length - 1];
    // if unsupported TLD, abort
    if (!supportedTopLevelDomains.includes(topLevelDomain)) {
      return;
    }
    // otherwise attempt resolve
    attemptResolve({ tabId, name, pathname, search, fragment });
  }

  async function attemptResolve({ tabId, name, pathname, search, fragment }) {
    const ipfsGateway = getIpfsGateway();
    const useAddressBarEnsResolution = getUseAddressBarEnsResolution();

    const ensSiteUrl = `https://app.ens.domains/name/${name}`;

    // We cannot show this if useAddressBarEnsResolution is off...
    if (useAddressBarEnsResolution && ipfsGateway) {
      browser.tabs.update(tabId, { url: 'loading.html' });
    }

    let url = ensSiteUrl;

    // If we're testing ENS domain resolution support,
    // we assume the ENS domains URL
    if (process.env.IN_TEST) {
      if (useAddressBarEnsResolution || ipfsGateway) {
        browser.tabs.update(tabId, { url });
      }
      return;
    }

    try {
      const { type, hash } = await resolveEnsToIpfsContentId({
        provider,
        name,
      });
      if (type === 'ipfs-ns' || type === 'ipns-ns') {
        // If the ENS is via IPFS and that setting is disabled,
        // Do not resolve the ENS
        if (ipfsGateway === '') {
          url = null;
          return;
        }
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
      // Only forward to destination URL if a URL exists and
      // useAddressBarEnsResolution is properly
      if (
        url &&
        (useAddressBarEnsResolution ||
          (!useAddressBarEnsResolution && url !== ensSiteUrl))
      ) {
        browser.tabs.update(tabId, { url });
      }
    }
  }
}
