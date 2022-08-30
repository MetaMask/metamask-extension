import { ALLOWED_UNSTOPPABLE_TLDS } from "../../../../shared/constants/uns";
import { isValidUnstoppableDomainName } from "../../../../ui/helpers/utils/util";
import resolveUnsToIpfsContentId from "./resolver";
import browser from 'webextension-polyfill';
import getFetchWithTimeout from "../../../../shared/modules/fetch-with-timeout";

const fetchWithTimeout = getFetchWithTimeout();

export default function setupUnsIpfsResolver({
}) {
    const urlPatterns = ALLOWED_UNSTOPPABLE_TLDS.map((tld) => `*://*${tld}/`)
    browser.webRequest.onErrorOccurred.addListener(webRequestDidFail, {
        urls: urlPatterns,
        types: ['main_frame'],
    });
    console.log(urlPatterns);
    return {
        remove() {
            browser.webRequest.onErrorOccurred.removeListener(webRequestDidFail);
        },
    };

    async function webRequestDidFail(details) {
        const {tabId, url} = details;
        if (tabId === -1) {
            return;
        }
        const {hostname: name} = new URL(url);
        if (!isValidUnstoppableDomainName(name)) {
            return;
        }
        attemptResolve({ tabId, name });
    }

    async function attemptResolve({ tabId, name}) {
        browser.tabs.update(tabId, {url: `unsloading.html`});
        let url = `http://unstoppabledomains.com/search?searchTerm=${name}`;
        try {
            const ipfsHash = await resolveUnsToIpfsContentId(name);
            if (ipfsHash){
                let resolvedUrl = `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`;
                const ipfsSiteResponse = await fetchWithTimeout(resolvedUrl, {
                    method: 'HEAD',
                });
                if (ipfsSiteResponse.status === 200){
                    url = resolvedUrl;
                }
            }
        } catch (err) {
            console.warn(err);
        } finally {
            browser.tabs.update(tabId, {url});
        }
    }
}