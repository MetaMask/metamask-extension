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
