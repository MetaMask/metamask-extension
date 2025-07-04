import {
  SecurityAlertResponse,
  TransactionType,
} from '@metamask/transaction-controller';

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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  approvalFarming = 'approval_farming',
  /** Malicious signature on Blur order  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  blurFarming = 'blur_farming',
  /** A known malicious site invoked that transaction  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  maliciousDomain = 'malicious_domain',
  /** Malicious signature on a Permit order  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  permitFarming = 'permit_farming',
  /** Direct theft of native assets (ETH/MATIC/AVAX/ etc …)  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rawNativeTokenTransfer = 'raw_native_token_transfer',
  /** Malicious raw signature from the user   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  rawSignatureFarming = 'raw_signature_farming',
  /** Malicious signature on a Seaport order  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  seaportFarming = 'seaport_farming',
  /** setApprovalForAll for a malicious operator  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  setApprovalForAll = 'set_approval_for_all',
  /** Malicious signature on other type of trade order (Zero-X / Rarible / etc..)   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tradeOrderFarming = 'trade_order_farming',
  /** Direct theft of assets using transfer  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transferFarming = 'transfer_farming',
  /** Direct theft of assets using transferFrom  */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transferFromFarming = 'transfer_from_farming',

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  other = 'other',

  // MetaMask defined reasons
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  errored = 'Error',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  notApplicable = 'NotApplicable',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

export const FALSE_POSITIVE_REPORT_BASE_URL =
  'https://blockaid-false-positive-portal.metamask.io';

export const SECURITY_PROVIDER_UTM_SOURCE = 'metamask-ppom';

export const SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
  TransactionType.swapAndSend,
  TransactionType.bridgeApproval,
  TransactionType.bridge,
];

export const LOADING_SECURITY_ALERT_RESPONSE: SecurityAlertResponse = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: BlockaidResultType.Loading,
  reason: BlockaidReason.inProgress,
};

export enum SecurityAlertSource {
  /** Validation performed remotely using the Security Alerts API. */
  API = 'api',

  /** Validation performed locally using the PPOM. */
  Local = 'local',
}
