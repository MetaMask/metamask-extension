export type CandidateSubscriptionId =
  | 'pending'
  | 'retry'
  | 'error'
  | 'error-existing-subscription-hardware-wallet-explicit-sign'
  | string
  | null;
