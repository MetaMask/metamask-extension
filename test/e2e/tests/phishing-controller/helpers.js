// These mirror the constants of the same name in `@metamask/phishing-controller`.
// They are duplicated rather than imported because that package is ESM-only as
// of v18, and requiring it from this CommonJS harness fails: its ESM graph does
// `import { toASCII } from 'punycode/punycode.js'`, and punycode's CommonJS
// build assigns `module.exports` from a variable, so Node cannot detect the
// named export when loading ESM synchronously from CJS.
const PHISHING_CONFIG_BASE_URL =
  'https://phishing-detection.api.cx.metamask.io';
const CLIENT_SIDE_DETECTION_BASE_URL =
  'https://client-side-detection.api.cx.metamask.io';

const METAMASK_STALELIST_URL = `${PHISHING_CONFIG_BASE_URL}/v1/stalelist`;
const METAMASK_HOTLIST_DIFF_URL = `${PHISHING_CONFIG_BASE_URL}/v2/diffsSince`;
const C2_DOMAIN_BLOCKLIST_URL = `${CLIENT_SIDE_DETECTION_BASE_URL}/v1/request-blocklist`;

const ListNames = {
  MetaMask: 'MetaMask',
};

/**
 * The block provider names.
 *
 * @enum {BlockProvider}
 * @readonly
 * @property {string} MetaMask - The name of the MetaMask block provider.
 */
const BlockProvider = {
  MetaMask: 'metamask',
};

/** Default C2 domain hash used across phishing E2E fixtures. */
const DEFAULT_BLOCKED_DOMAIN =
  'a379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce1947';

/**
 * Waits until the PhishingController has fetched and processed its blocklist.
 * The fixture pre-populates `stalelistLastFetched` with a non-zero timestamp,
 * so we check `phishingLists.length > 0` instead — that only becomes true
 * after the runtime has fetched and parsed the stalelist from the mock server.
 *
 * @param {object} driver - The E2E test Driver instance.
 * @returns {Promise<void>}
 */
async function waitForPhishingBlocklistToBeLoaded(driver) {
  await driver.wait(async () => {
    const state = await driver.executeScript(
      'return window.stateHooks.getPersistedState()',
    );
    const lists = state?.data?.PhishingController?.phishingLists;
    return Array.isArray(lists) && lists.length > 0;
  }, 10000);
  // The state being populated doesn't guarantee the extension's content
  // script / webNavigation handlers are registered yet. A brief delay
  // lets the browser finish activating its interception mechanisms.
  await driver.delay(2500);
}

module.exports = {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  C2_DOMAIN_BLOCKLIST_URL,
  BlockProvider,
  ListNames,
  DEFAULT_BLOCKED_DOMAIN,
  waitForPhishingBlocklistToBeLoaded,
};
