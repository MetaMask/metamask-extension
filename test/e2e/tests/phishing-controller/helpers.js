const {
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  C2_DOMAIN_BLOCKLIST_URL,
  ListNames,
} = require('@metamask/phishing-controller');

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

module.exports = {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  C2_DOMAIN_BLOCKLIST_URL,
  BlockProvider,
  ListNames,
  DEFAULT_BLOCKED_DOMAIN,
};
