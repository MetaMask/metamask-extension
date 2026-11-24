import type {
  MoneyAccountBalanceCheckRequest,
  MoneyAccountBalanceCheckResult,
  StartSubscriptionWithDelegationRequest,
  StartSubscriptionWithDelegationResult,
} from '@metamask/subscription-controller';
import { submitRequestToBackground } from '../background-connection';

/**
 * Checks whether the Money Account can cover the subscription funding requirement.
 *
 * @param request - The product, billing interval, and payer address.
 * @returns The balance check result, with amounts in mUSD base units.
 */
export function checkMoneyAccountPlusBalance(
  request: MoneyAccountBalanceCheckRequest,
): Promise<MoneyAccountBalanceCheckResult> {
  return submitRequestToBackground(
    'SubscriptionDelegationService:checkMoneyAccountBalance',
    [request],
  );
}

/**
 * Starts a Money Account Plus subscription with a payment delegation.
 * The caller must obtain the user's consent before calling this action.
 *
 * @param request - The subscription details and payer information.
 * @returns The newly created subscription.
 */
export function startMoneyAccountPlusSubscription(
  request: StartSubscriptionWithDelegationRequest,
): Promise<StartSubscriptionWithDelegationResult> {
  return submitRequestToBackground(
    'SubscriptionDelegationService:startSubscriptionWithDelegation',
    [request],
  );
}
