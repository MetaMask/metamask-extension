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

// Error codes with specific locale for submit claim errors from backend
export const SUBMIT_CLAIM_ERROR_CODES = {
  // System & General Errors (E001-E099)
  INTERNAL_SERVER_ERROR: 'E001', // Claim submission failed
  VALIDATION_ERROR: 'E002', // Show detailed error message in errorsDetails
  RESOURCE_NOT_FOUND: 'E003', // Claim not found
  DATABASE_FAILED: 'E004', // Claim submission failed

  // Coverage Validation (E100-E199)
  COVERAGE_API_NOT_CONFIGURED: 'E101', // Claim submission failed
  TRANSACTION_NOT_ELIGIBLE: 'E102', // This transaction was not made within MetaMask and is not eligible for claims.
  SUBMISSION_WINDOW_EXPIRED: 'E103', // Submission window expired. Claims must be filed within ${validPeriodInDays} days of the incident.
  TRANSACTION_NOT_COVERED: 'E104', // Claim submission failed
  COVERAGE_VALIDATION_FAILED: 'E105', // Claim submission failed

  // Claims Validation (E200-E299)
  CLAIM_VALIDATION_FAILED: 'E201', // Claim submission failed
  MAX_CLAIMS_LIMIT_EXCEEDED: 'E202', // You have reached the maximum limit of open claims. Please contact support if you need to submit additional claims.
  DUPLICATE_CLAIM_EXISTS: 'E203', // A claim has already been submitted for this transaction hash
  INVALID_WALLET_ADDRESSES: 'E204', // Impacted wallet address and reimbursement wallet address must be different

  // Field Validation Errors (E250-E299)
  FIELD_REQUIRED: 'E250', // This field is required
  FIELD_IS_NOT_STRING: 'E251', // Invalid format for field
  FIELD_IS_NOT_NUMBER: 'E252', // Invalid format for field
  FIELD_IS_NOT_OBJECT: 'E253', // Invalid format for field
  FIELD_INVALID_EMAIL: 'E254', // Invalid email address
  FIELD_INVALID_UUID: 'E255', // Invalid UUID
  FIELD_INVALID_TYPE: 'E256', // Invalid type for field
  FIELD_INVALID_VALUE: 'E257', // Invalid value for field
  FIELD_INVALID_FORMAT: 'E258', // Invalid format for field
  FIELD_INVALID_ETHEREUM_ADDRESS: 'E259', // Invalid Ethereum address

  // File Operations (E300-E399)
  FILES_SIZE_EXCEEDED: 'E301', // Total file size exceeds the maximum allowed size
  FILES_COUNT_EXCEEDED: 'E302', // Number of files exceeds the maximum allowed count
  INVALID_FILES_TYPE: 'E303', // Invalid file type
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
