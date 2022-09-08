import {
    isValidUnstoppableDomainName,
    getUdTlds,
} from "../../../../ui/helpers/utils/util";
import resolveUnsToIpfsContentId from "./resolver";
import browser from 'webextension-polyfill';

export default async function setupUnsIpfsResolver({
}) {
    const udTlds = await getUdTlds();
    const urlPatterns = udTlds.map((tld) => `*://*.${tld}/`)
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
        if (!isValidUnstoppableDomainName(name)) {
            return;
        }
        attemptResolve({ tabId, name });
    }

    async function attemptResolve({ tabId, name }) {
        browser.tabs.update(tabId, { url: `unsloading.html` });
        let url = `http://unstoppabledomains.com/search?searchTerm=${name}`;
        try {
            const ipfsHash = await resolveUnsToIpfsContentId(name);
            if (ipfsHash) {
                url = `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`;
            }
        } catch (err) {
            console.warn(err);
            url = `http://unstoppabledomains.com/search?searchTerm=${name}`;
        } finally {
            browser.tabs.update(tabId, { url });
        }
    }
}