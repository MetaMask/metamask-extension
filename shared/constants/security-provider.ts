export enum SecurityProvider {
  Blockaid = 'blockaid',
}

/** The reason, also referred to as the attack type, provided in the PPOM Response  */
export enum BlockaidReason {
  /** Approval for a malicious spender  */
  approvalFarming = 'approval_farming',
  /** Malicious signature on Blur order  */
  blurFarming = 'blur_farming',
  /** A known malicous site invoked that transaction  */
  maliciousDomain = 'malicious_domain',
  /** Malicious signature on a Permit order  */
  permitFarming = 'permit_farming',
  /** Direct theft of native assets (ETH/MATIC/AVAX/ etc …)  */
  rawNativeTokenTransfer = 'raw_native_token_transfer',
  /** Malicious raw signature from the user   */
  rawSignatureFarming = 'raw_signature_farming',
  /** Malicious signature on a Seaport order  */
  seaportFarming = 'seaport_farming',
  /** setApprovalForAll for a malicious operator  */
  setApprovalForAll = 'set_approval_for_all',
  /** Malicious signature on other type of trade order (Zero-X / Rarible / etc..)   */
  tradeOrderFarming = 'trade_order_farming',
  /** Direct theft of assets using transfer  */
  transferFarming = 'transfer_farming',
  /** Direct theft of assets using transferFrom  */
  transferFromFarming = 'transfer_from_farming',

  other = 'other',

  // MetaMask defined reasons
  errored = 'Error',
  notApplicable = 'NotApplicable',
  inProgress = 'validation_in_progress',
}

export enum BlockaidResultType {
  Malicious = 'Malicious',
  Warning = 'Warning',
  Benign = 'Benign',
  Errored = 'Error',

  // MetaMask defined result types
  NotApplicable = 'NotApplicable',
  Loading = 'loading',
}

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

export const FALSE_POSITIVE_REPORT_BASE_URL =
  'https://blockaid-false-positive-portal.metamask.io';
export const SECURITY_PROVIDER_UTM_SOURCE = 'metamask-ppom';
