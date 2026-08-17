import { BlockaidReason } from '../../../../../shared/constants/security-provider';

export enum AlertsName {
  AccountNoFunds = 'accountNoFunds',
  AddressPoisoning = 'address_poisoning',
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
  PayHardwareAccount = 'payHardwareAccount',
  SigningOrSubmitting = 'signingOrSubmitting',
  Blockaid = 'blockaid',
}

/** Reason to description translation key mapping. Grouped by translations. */
export const REASON_TO_DESCRIPTION_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.permitFarming]: 'blockaidDescriptionApproveFarming',
  [BlockaidReason.setApprovalForAll]: 'blockaidDescriptionApproveFarming',

  [BlockaidReason.blurFarming]: 'blockaidDescriptionMarketplaceFarming',
  [BlockaidReason.seaportFarming]: 'blockaidDescriptionMarketplaceFarming',

  [BlockaidReason.errored]: 'blockaidDescriptionErrored',

  [BlockaidReason.maliciousDomain]: 'blockaidDescriptionMaliciousDomain',

  [BlockaidReason.rawSignatureFarming]: 'blockaidDescriptionHighRiskSignature',
  [BlockaidReason.tradeOrderFarming]: 'blockaidDescriptionHighRiskSignature',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFarming]: 'blockaidDescriptionTransferFarming',
  [BlockaidReason.transferFromFarming]: 'blockaidDescriptionTransferFarming',

  [BlockaidReason.other]: 'blockaidDescriptionRiskSignals',
});

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
export const REASON_TO_TITLE_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidTitleHighRiskApproval',
  [BlockaidReason.permitFarming]: 'blockaidTitleHighRiskApproval',
  [BlockaidReason.setApprovalForAll]: 'blockaidTitleHighRiskApproval',

  [BlockaidReason.blurFarming]: 'blockaidTitleHighRiskApproval',
  [BlockaidReason.seaportFarming]: 'blockaidTitleHighRiskApproval',

  [BlockaidReason.errored]: 'blockaidTitleMayNotBeSafe',

  [BlockaidReason.maliciousDomain]: 'blockaidTitleSiteFlaggedUnsafe',

  [BlockaidReason.rawSignatureFarming]: 'blockaidTitleHighRiskSignature',
  [BlockaidReason.tradeOrderFarming]: 'blockaidTitleHighRiskSignature',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidTitleHighRiskTransfer',
  [BlockaidReason.transferFarming]: 'blockaidTitleHighRiskTransfer',
  [BlockaidReason.transferFromFarming]: 'blockaidTitleHighRiskTransfer',

  [BlockaidReason.other]: 'blockaidTitleRiskSignalsDetected',
});

/**
 * Reason to request-type noun translation key mapping. The noun is composed
 * into the confirm-anyway modal message ("...high-risk signals in this
 * approval").
 */
export const REASON_TO_REQUEST_TYPE_TKEY = Object.freeze({
  [BlockaidReason.approvalFarming]: 'blockaidRequestTypeApproval',
  [BlockaidReason.permitFarming]: 'blockaidRequestTypeApproval',
  [BlockaidReason.setApprovalForAll]: 'blockaidRequestTypeApproval',
  [BlockaidReason.blurFarming]: 'blockaidRequestTypeApproval',
  [BlockaidReason.seaportFarming]: 'blockaidRequestTypeApproval',

  [BlockaidReason.rawSignatureFarming]: 'blockaidRequestTypeSignature',
  [BlockaidReason.tradeOrderFarming]: 'blockaidRequestTypeSignature',

  [BlockaidReason.rawNativeTokenTransfer]: 'blockaidRequestTypeTransfer',
  [BlockaidReason.transferFarming]: 'blockaidRequestTypeTransfer',
  [BlockaidReason.transferFromFarming]: 'blockaidRequestTypeTransfer',

  [BlockaidReason.maliciousDomain]: 'blockaidRequestTypeRequest',
  [BlockaidReason.other]: 'blockaidRequestTypeRequest',
});
