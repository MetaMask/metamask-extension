export enum SecurityProvider {
  Blockaid = 'blockaid',
}

/**
 * @typedef {object} SecurityProviderConfig
 * @property {string} tKeyName - translation key for security provider name
 * @property {string} url - URL to securty provider website
 */

/** @type {Record<string, SecurityProviderConfig>} */
export const SECURITY_PROVIDER_CONFIG = {
  [SecurityProvider.Blockaid]: {
    tKeyName: 'blockaid',
    url: 'https://blockaid.io/',
  },
};

/**
 * @typedef {object} SecurityProviderMessageSeverity
 * @property {0} NOT_MALICIOUS - Indicates message is not malicious
 * @property {1} MALICIOUS - Indicates message is malicious
 * @property {2} NOT_SAFE - Indicates message is not safe
 */

/** @type {SecurityProviderMessageSeverity} */
export const SECURITY_PROVIDER_MESSAGE_SEVERITY = {
  NOT_MALICIOUS: 0,
  MALICIOUS: 1,
  NOT_SAFE: 2,
};
