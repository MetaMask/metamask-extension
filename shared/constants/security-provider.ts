export enum SecurityProvider {
  Blockaid = 'blockaid',
}

type SecurityProviderConfig = Record<
  SecurityProvider,
  {
    /** translation key for security provider name */
    tKeyName: string;
    /** URL to securty provider website */
    url: string;
  }
>;

export const SECURITY_PROVIDER_CONFIG: SecurityProviderConfig = {
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
