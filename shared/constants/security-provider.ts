import { Hex } from '@metamask/utils';
import {
  SecurityAlertResponse,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from './network';

export enum SecurityProvider {
  Blockaid = 'blockaid',
}

type SecurityProviderConfig = Record<
  SecurityProvider,
  {
    /** translation key for security provider name */
    readonly tKeyName: string;
    /** URL to security provider website */
    readonly url: string;
  }
>;

export const SECURITY_PROVIDER_CONFIG: Readonly<SecurityProviderConfig> = {
  [SecurityProvider.Blockaid]: {
    tKeyName: 'blockaid',
    url: 'https://blockaid.io/',
  },
};

/** The reason, also referred to as the attack type, provided in the PPOM Response  */
export enum BlockaidReason {
  /** Approval for a malicious spender  */
  approvalFarming = 'approval_farming',
  /** Malicious signature on Blur order  */
  blurFarming = 'blur_farming',
  /** A known malicious site invoked that transaction  */
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
  checkingChain = 'CheckingChain',
  chainNotSupported = 'ChainNotSupported',
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

export const SECURITY_PROVIDER_SUPPORTED_CHAIN_IDS_FALLBACK_LIST: Hex[] = [
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.BASE,
  CHAIN_IDS.BSC,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.OPBNB,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.ZKSYNC_ERA,
  CHAIN_IDS.SCROLL,
  CHAIN_IDS.BERACHAIN,
  CHAIN_IDS.METACHAIN_ONE,
];

export const SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.swapAndSend,
];

export const LOADING_SECURITY_ALERT_RESPONSE: SecurityAlertResponse = {
  result_type: BlockaidResultType.Loading,
  reason: BlockaidReason.inProgress,
};

export const SECURITY_ALERT_RESPONSE_CHECKING_CHAIN: SecurityAlertResponse = {
  result_type: BlockaidResultType.Loading,
  reason: BlockaidReason.checkingChain,
};

export const SECURITY_ALERT_RESPONSE_CHAIN_NOT_SUPPORTED: SecurityAlertResponse =
  {
    result_type: BlockaidResultType.Benign,
    reason: BlockaidReason.chainNotSupported,
  };

export enum SecurityAlertSource {
  /** Validation performed remotely using the Security Alerts API. */
  API = 'api',

  /** Validation performed locally using the PPOM. */
  Local = 'local',
}
