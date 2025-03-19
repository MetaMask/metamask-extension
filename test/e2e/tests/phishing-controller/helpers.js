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

module.exports = {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  C2_DOMAIN_BLOCKLIST_URL,
  BlockProvider,
  ListNames,
};
