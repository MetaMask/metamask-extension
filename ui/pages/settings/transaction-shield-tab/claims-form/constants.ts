import {
  SUBMIT_CLAIM_FIELDS,
  SUBMIT_CLAIM_ERROR_CODES,
  type SubmitClaimErrorCode,
  SubmitClaimField,
} from '../types';

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Error codes for codes on the root level of the error response
export const ERROR_MESSAGE_MAP: Partial<
  Record<
    SubmitClaimErrorCode,
    {
      messageKey: string;
      params?: (string | number)[];
      field?: SubmitClaimField;
    }
  >
> = {
  [SUBMIT_CLAIM_ERROR_CODES.TRANSACTION_NOT_ELIGIBLE]: {
    messageKey: 'shieldClaimImpactedTxHashNotEligible',
    field: SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
  },
  [SUBMIT_CLAIM_ERROR_CODES.SUBMISSION_WINDOW_EXPIRED]: {
    messageKey: 'shieldClaimSubmissionWindowExpired',
  },
  [SUBMIT_CLAIM_ERROR_CODES.MAX_CLAIMS_LIMIT_EXCEEDED]: {
    messageKey: 'shieldClaimMaxClaimsLimitExceeded',
  },
  [SUBMIT_CLAIM_ERROR_CODES.DUPLICATE_CLAIM_EXISTS]: {
    messageKey: 'shieldClaimDuplicateClaimExists',
  },
  [SUBMIT_CLAIM_ERROR_CODES.INVALID_WALLET_ADDRESSES]: {
    messageKey: 'shieldClaimSameWalletAddressesError',
    field: SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS,
  },
  [SUBMIT_CLAIM_ERROR_CODES.FILES_SIZE_EXCEEDED]: {
    messageKey: 'shieldClaimFileErrorSizeExceeded',
  },
  [SUBMIT_CLAIM_ERROR_CODES.FILES_COUNT_EXCEEDED]: {
    messageKey: 'shieldClaimFileErrorCountExceeded',
  },
  [SUBMIT_CLAIM_ERROR_CODES.INVALID_FILES_TYPE]: {
    messageKey: 'shieldClaimFileErrorInvalidType',
  },
  [SUBMIT_CLAIM_ERROR_CODES.FIELD_REQUIRED]: {
    messageKey: 'shieldClaimInvalidRequired',
  },
  [SUBMIT_CLAIM_ERROR_CODES.SIGNATURE_COVERAGE_NOT_COVERED]: {
    messageKey: 'shieldClaimSignatureCoverageNotCovered',
  },
  [SUBMIT_CLAIM_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED]: {
    messageKey: 'shieldClaimWalletOwnershipValidationFailed',
  },
  [SUBMIT_CLAIM_ERROR_CODES.CHAIN_NOT_SUPPORTED]: {
    messageKey: 'shieldClaimChainNotSupported',
    field: SUBMIT_CLAIM_FIELDS.CHAIN_ID,
  },
  [SUBMIT_CLAIM_ERROR_CODES.TRANSACTION_NOT_FOUND]: {
    messageKey: 'shieldClaimTransactionNotFound',
    field: SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
  },
  [SUBMIT_CLAIM_ERROR_CODES.TRANSACTION_NOT_FROM_WALLET_ADDRESS]: {
    messageKey: 'shieldClaimTransactionNotFromWalletAddress',
    field: SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
  },
  [SUBMIT_CLAIM_ERROR_CODES.TRANSACTION_NOT_SUCCESSFUL]: {
    messageKey: 'shieldClaimTransactionNotSuccessful',
    field: SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH,
  },
};

// Error codes for fields in the error response
export const FIELD_ERROR_MESSAGE_KEY_MAP: Partial<
  Record<SubmitClaimField, string>
> = {
  [SUBMIT_CLAIM_FIELDS.CHAIN_ID]: 'shieldClaimInvalidChainId',
  [SUBMIT_CLAIM_FIELDS.EMAIL]: 'shieldClaimInvalidEmail',
  [SUBMIT_CLAIM_FIELDS.IMPACTED_WALLET_ADDRESS]:
    'shieldClaimInvalidWalletAddress',
  [SUBMIT_CLAIM_FIELDS.IMPACTED_TRANSACTION_HASH]: 'shieldClaimInvalidTxHash',
  [SUBMIT_CLAIM_FIELDS.REIMBURSEMENT_WALLET_ADDRESS]:
    'shieldClaimInvalidWalletAddress',
};
