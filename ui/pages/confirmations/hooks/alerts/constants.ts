import { BlockaidReason } from '../../../../../shared/constants/security-provider';

export enum AlertsName {
  AccountNoFunds = 'accountNoFunds',
  AddressPoisoning = 'address_poisoning',
  DepositLimit = 'depositLimit',
  GasEstimateFailed = 'gasEstimateFailed',
  GasFeeLow = 'gasFeeLow',
  GasTooLow = 'gasTooLow',
  InsufficientBalance = 'insufficientBalance',
  InsufficientPayTokenBalance = 'insufficientPayTokenBalance',
  InsufficientPayTokenNative = 'insufficientPayTokenNative',
  InsufficientPayTokenFees = 'insufficientPayTokenFees',
  NetworkBusy = 'networkBusy',
  NoGasPrice = 'noGasPrice',
  NoPayTokenQuotes = 'noPayTokenQuotes',
  PendingTransaction = 'pendingTransactions',
  PerpsWithdrawBalanceUnavailable = 'perpsWithdrawBalanceUnavailable',
  PayHardwareAccount = 'payHardwareAccount',
  SigningOrSubmitting = 'signingOrSubmitting',
  Blockaid = 'blockaid',
}

const APPROVAL_REASONS = [
  BlockaidReason.approvalFarming,
  BlockaidReason.permitFarming,
  BlockaidReason.setApprovalForAll,
] as const;

const MARKETPLACE_REASONS = [
  BlockaidReason.blurFarming,
  BlockaidReason.seaportFarming,
] as const;

const SIGNATURE_REASONS = [
  BlockaidReason.rawSignatureFarming,
  BlockaidReason.tradeOrderFarming,
] as const;

const TRANSFER_REASONS = [
  BlockaidReason.rawNativeTokenTransfer,
  BlockaidReason.transferFarming,
  BlockaidReason.transferFromFarming,
] as const;

function createReasonMap<Value extends string>(
  entries: readonly (readonly [readonly BlockaidReason[], Value])[],
): Readonly<Partial<Record<BlockaidReason, Value>>> {
  return Object.freeze(
    Object.fromEntries(
      entries.flatMap(([reasons, value]) =>
        reasons.map((reason) => [reason, value] as const),
      ),
    ),
  );
}

/** Reason to description translation key mapping. Grouped by translations. */
export const REASON_TO_DESCRIPTION_TKEY = createReasonMap([
  [APPROVAL_REASONS, 'blockaidDescriptionApproveFarming'],
  [MARKETPLACE_REASONS, 'blockaidDescriptionMarketplaceFarming'],
  [[BlockaidReason.errored], 'blockaidDescriptionErrored'],
  [[BlockaidReason.maliciousDomain], 'blockaidDescriptionMaliciousDomain'],
  [SIGNATURE_REASONS, 'blockaidDescriptionHighRiskSignature'],
  [TRANSFER_REASONS, 'blockaidDescriptionTransferFarming'],
  [[BlockaidReason.other], 'blockaidDescriptionRiskSignals'],
]);

/**
 * Amount-bearing variants of banner descriptions, used when a formatted fiat
 * total of outgoing assets is available. The amount is injected as $1.
 */
export const REASON_TO_DESCRIPTION_WITH_AMOUNT_TKEY = Object.freeze({
  [BlockaidReason.maliciousDomain]:
    'blockaidDescriptionMaliciousDomainWithAmount',

  [BlockaidReason.rawNativeTokenTransfer]:
    'blockaidDescriptionTransferFarmingWithAmount',
  [BlockaidReason.transferFarming]:
    'blockaidDescriptionTransferFarmingWithAmount',
  [BlockaidReason.transferFromFarming]:
    'blockaidDescriptionTransferFarmingWithAmount',
});

/**
 * Marketplace display names injected into
 * blockaidDescriptionMarketplaceFarming as $1. Product names are not
 * localized.
 */
export const REASON_TO_MARKETPLACE_NAME = Object.freeze({
  [BlockaidReason.blurFarming]: 'Blur',
  [BlockaidReason.seaportFarming]: 'OpenSea',
});

/** Reason to title translation key mapping. */
export const REASON_TO_TITLE_TKEY = createReasonMap([
  [
    [...APPROVAL_REASONS, ...MARKETPLACE_REASONS],
    'blockaidTitleHighRiskApproval',
  ],
  [[BlockaidReason.errored], 'blockaidTitleMayNotBeSafe'],
  [[BlockaidReason.maliciousDomain], 'blockaidTitleSiteFlaggedUnsafe'],
  [SIGNATURE_REASONS, 'blockaidTitleHighRiskSignature'],
  [TRANSFER_REASONS, 'blockaidTitleHighRiskTransfer'],
  [[BlockaidReason.other], 'blockaidTitleRiskSignalsDetected'],
]);

/**
 * Reason to request-type noun translation key mapping. The noun is composed
 * into the confirm-anyway modal message ("...high-risk signals in this
 * approval").
 */
export const REASON_TO_REQUEST_TYPE_TKEY = createReasonMap([
  [
    [...APPROVAL_REASONS, ...MARKETPLACE_REASONS],
    'blockaidRequestTypeApproval',
  ],
  [SIGNATURE_REASONS, 'blockaidRequestTypeSignature'],
  [TRANSFER_REASONS, 'blockaidRequestTypeTransfer'],
  [
    [BlockaidReason.maliciousDomain, BlockaidReason.other],
    'blockaidRequestTypeRequest',
  ],
]);
