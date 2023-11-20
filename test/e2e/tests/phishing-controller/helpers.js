const {
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  ListNames,
} = require('@metamask/phishing-controller');

/**
 * The block provider names.
 *
 * @enum {BlockProvider}
 * @readonly
 * @property {string} MetaMask - The name of the MetaMask block provider.
 * @property {string} PhishFort - The name of the PhishFort block provider.
 */
const BlockProvider = {
  MetaMask: 'metamask',
  PhishFort: 'phishfort',
};

module.exports = {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  BlockProvider,
  ListNames,
};
