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
