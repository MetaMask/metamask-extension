export const UNAPPROVED_STATUS = 'unapproved'
export const REJECTED_STATUS = 'rejected'
export const APPROVED_STATUS = 'approved'
export const SIGNED_STATUS = 'signed'
export const SUBMITTED_STATUS = 'submitted'
export const CONFIRMED_STATUS = 'confirmed'
export const FAILED_STATUS = 'failed'
export const DROPPED_STATUS = 'dropped'
export const CANCELLED_STATUS = 'cancelled'

export const PENDING_STATUS_HASH = {
  [UNAPPROVED_STATUS]: true,
  [APPROVED_STATUS]: true,
  [SUBMITTED_STATUS]: true,
}

export const PRIORITY_STATUS_HASH = {
  ...PENDING_STATUS_HASH,
  [CONFIRMED_STATUS]: true,
}

export const TOKEN_METHOD_TRANSFER = 'transfer'
export const TOKEN_METHOD_APPROVE = 'approve'
export const TOKEN_METHOD_TRANSFER_FROM = 'transferfrom'

export const TOKEN_CATEGORY_HASH = {
  [TOKEN_METHOD_APPROVE]: true,
  [TOKEN_METHOD_TRANSFER]: true,
  [TOKEN_METHOD_TRANSFER_FROM]: true,
}

export const INCOMING_TRANSACTION = 'incoming'

export const SEND_ETHER_ACTION_KEY = 'sentEther'
export const DEPLOY_CONTRACT_ACTION_KEY = 'contractDeployment'
export const APPROVE_ACTION_KEY = 'approve'
export const SEND_TOKEN_ACTION_KEY = 'sentTokens'
export const TRANSFER_FROM_ACTION_KEY = 'transferFrom'
export const SIGNATURE_REQUEST_KEY = 'signatureRequest'
export const DECRYPT_REQUEST_KEY = 'decryptRequest'
export const ENCRYPTION_PUBLIC_KEY_REQUEST_KEY = 'encryptionPublicKeyRequest'
export const CONTRACT_INTERACTION_KEY = 'contractInteraction'
export const CANCEL_ATTEMPT_ACTION_KEY = 'cancelAttempt'
export const DEPOSIT_TRANSACTION_KEY = 'deposit'

// Transaction List Item Categories
// Used for UI distinction between transactions in the history list
export const TRANSACTION_CATEGORY_SEND = 'send'
export const TRANSACTION_CATEGORY_RECEIVE = 'receive'
export const TRANSACTION_CATEGORY_INTERACTION = 'interaction'
export const TRANSACTION_CATEGORY_APPROVAL = 'approval'
export const TRANSACTION_CATEGORY_SIGNATURE_REQUEST = 'signature-request'
