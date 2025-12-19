import { AccountWalletId } from '@metamask/account-api';
import {
  PAYMENT_TYPES,
  SubscriptionCardPaymentMethod,
  SubscriptionCryptoPaymentMethod,
  SubscriptionPaymentMethod,
} from '@metamask/subscription-controller';

export function isCryptoPaymentMethod(
  paymentMethod: SubscriptionPaymentMethod,
): paymentMethod is SubscriptionCryptoPaymentMethod {
  return paymentMethod.type === PAYMENT_TYPES.byCrypto;
}

export function isCardPaymentMethod(
  paymentMethod: SubscriptionPaymentMethod,
): paymentMethod is SubscriptionCardPaymentMethod {
  return paymentMethod.type === PAYMENT_TYPES.byCard;
}

export const SUBMIT_CLAIM_FIELDS = {
  CHAIN_ID: 'chainId',
  EMAIL: 'email',
  IMPACTED_WALLET_ADDRESS: 'impactedWalletAddress',
  IMPACTED_TRANSACTION_HASH: 'impactedTxHash',
  REIMBURSEMENT_WALLET_ADDRESS: 'reimbursementWalletAddress',
  CASE_DESCRIPTION: 'caseDescription',
  FILES: 'files',
} as const;

export type SubmitClaimField =
  (typeof SUBMIT_CLAIM_FIELDS)[keyof typeof SUBMIT_CLAIM_FIELDS];

// Error codes for submit claim errors from backend
// Based on https://github.com/consensys-vertical-apps/va-mmcx-shield-claims-api/blob/main/src/errors/error-codes.ts
export const SUBMIT_CLAIM_ERROR_CODES = {
  // System & General Errors (E001-E099)
  INTERNAL_SERVER_ERROR: 'E001',
  VALIDATION_ERROR: 'E002',
  RESOURCE_NOT_FOUND: 'E003',
  DATABASE_FAILED: 'E004',

  // Coverage Validation (E100-E199)
  COVERAGE_API_NOT_CONFIGURED: 'E101',
  TRANSACTION_NOT_ELIGIBLE: 'E102',
  SUBMISSION_WINDOW_EXPIRED: 'E103',
  TRANSACTION_NOT_COVERED: 'E104',
  COVERAGE_VALIDATION_FAILED: 'E105',
  SIGNATURE_COVERAGE_NOT_COVERED: 'E106',

  // Claims Validation (E200-E299)
  CLAIM_VALIDATION_FAILED: 'E201',
  MAX_CLAIMS_LIMIT_EXCEEDED: 'E202',
  DUPLICATE_CLAIM_EXISTS: 'E203',
  INVALID_WALLET_ADDRESSES: 'E204',
  SIGNATURE_VERIFICATION_FAILED: 'E205',

  // Field Validation Errors (E250-E299)
  FIELD_REQUIRED: 'E250',
  FIELD_IS_NOT_STRING: 'E251',
  FIELD_IS_NOT_NUMBER: 'E252',
  FIELD_IS_NOT_OBJECT: 'E253',
  FIELD_INVALID_EMAIL: 'E254',
  FIELD_INVALID_UUID: 'E255',
  FIELD_INVALID_TYPE: 'E256',
  FIELD_INVALID_VALUE: 'E257',
  FIELD_INVALID_FORMAT: 'E258',
  FIELD_INVALID_ETHEREUM_ADDRESS: 'E259',

  // File Operations (E300-E399)
  FILES_SIZE_EXCEEDED: 'E301',
  FILES_COUNT_EXCEEDED: 'E302',
  INVALID_FILES_TYPE: 'E303',

  // Chains (E400-E499)
  CHAIN_NOT_SUPPORTED: 'E401',
  TRANSACTION_NOT_FOUND: 'E402',
  TRANSACTION_NOT_FROM_WALLET_ADDRESS: 'E403',
  TRANSACTION_NOT_SUCCESSFUL: 'E404',
} as const;

export type SubmitClaimErrorCode =
  (typeof SUBMIT_CLAIM_ERROR_CODES)[keyof typeof SUBMIT_CLAIM_ERROR_CODES];

export type SubmitClaimErrorResponse = {
  message: string;
  errorCode: SubmitClaimErrorCode;
  statusCode: number;
  errorsDetails?: {
    field: SubmitClaimField;
    error: string;
    errorCode: SubmitClaimErrorCode;
  }[];
};

export type AccountSelectorAccount = {
  id: string;
  name: string;
  address: string;
  type: string;
  seedIcon?: string;
};

export type AccountSelectorWallet = {
  id: AccountWalletId;
  name: string;
  accounts: AccountSelectorAccount[];
};

export const SHIELD_ICON_ARTBOARD_NAMES = {
  PROTECTION: 'Protection',
  PRIORITY: 'Priority',
} as const;

export type ShieldIconArtboardName =
  (typeof SHIELD_ICON_ARTBOARD_NAMES)[keyof typeof SHIELD_ICON_ARTBOARD_NAMES];

export const CLAIMS_TAB_KEYS = {
  PENDING: 'pending',
  HISTORY: 'history',
} as const;

export type ClaimsTabKey =
  (typeof CLAIMS_TAB_KEYS)[keyof typeof CLAIMS_TAB_KEYS];
