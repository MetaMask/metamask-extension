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

export const CLAIM_STATUS = {
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  PENDING: 'pending',
} as const;

export type ClaimStatus = (typeof CLAIM_STATUS)[keyof typeof CLAIM_STATUS];

type ShieldClaimAttachment = {
  key: string;
  mimetype: string;
  publicUrl: string;
  versionId: string;
  contentType: string;
  originalname: string;
};

export type ShieldClaim = {
  id: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  impactedWalletAddress: string;
  impactedTxHash: string;
  reimbursementWalletAddress: string;
  description: string;
  attachments: ShieldClaimAttachment[];
  intercomId: string;
  status?: ClaimStatus;
};
