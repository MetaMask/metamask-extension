import { RecurringInterval } from "@metamask/subscription-controller";
import { InternalAccountWithBalance } from "../../../selectors/selectors.types";
import { ShieldUserAccountCategoryEnum, ShieldUserAccountTypeEnum, ShieldUserBalanceRangeCategoryEnum } from "../../../../shared/constants/subscriptions";
import { KeyringObject } from "@metamask/keyring-controller";
import { KeyringType } from "../../../../shared/constants/keyring";
import { CaptureShieldSubscriptionRequestParams } from "./types";

export function getBillingIntervalForSegment(interval: RecurringInterval) {
  // TODO: Looks Odd, update the segment schema maybe?
  return interval === 'month' ? 'monthly' : 'yearly';
}

export function getBillingCyclesForSegment(interval: RecurringInterval) {
  return interval === 'month' ? 12 : 1;
}

export function getUserAccountType(account: InternalAccountWithBalance): ShieldUserAccountTypeEnum {
  if (account.type === 'eip155:eoa') {
    return ShieldUserAccountTypeEnum.EOA;
  } else if (account.type === 'eip155:erc4337') {
    return ShieldUserAccountTypeEnum.ERC4337;
  }
  // Shield is currently only supported for EVM accounts, so this should never happen
  throw new Error('Unsupported account type');
}

export function getUserAccountCategory(account: InternalAccountWithBalance, keyringsMetadata: KeyringObject[]): ShieldUserAccountCategoryEnum {
  const entropySource = account.options?.entropySource;
  const isHdKeyringAccount = account.metadata.keyring.type === KeyringType.hdKeyTree;

  if (entropySource && isHdKeyringAccount) {
    const keyringIndex = keyringsMetadata.findIndex((keyring) => keyring.metadata.id === entropySource);
    if (keyringIndex === 0) {
      return ShieldUserAccountCategoryEnum.PRIMARY;
    } else if (keyringIndex > 0) {
      return ShieldUserAccountCategoryEnum.ImportedWallet;
    }
  }
  return ShieldUserAccountCategoryEnum.ImportedAccount;
}

export function getUserBalanceCategory(balanceInUSD: number): ShieldUserBalanceRangeCategoryEnum {
  if (balanceInUSD < 100) {
    return ShieldUserBalanceRangeCategoryEnum.LessThan100;
  } else if (balanceInUSD >= 100 && balanceInUSD < 1000) {
    return ShieldUserBalanceRangeCategoryEnum.Between100And1K;
  } else if (balanceInUSD >= 1000 && balanceInUSD < 10000) {
    return ShieldUserBalanceRangeCategoryEnum.Between1KAnd10K;
  } else if (balanceInUSD >= 10000 && balanceInUSD < 100000) {
    return ShieldUserBalanceRangeCategoryEnum.Between10KAnd100K;
  } else {
    return ShieldUserBalanceRangeCategoryEnum.MoreThan100K;
  }
}

export function getUserAccountTypeAndCategory(account: InternalAccountWithBalance, keyringsMetadata: KeyringObject[]) {
  const userAccountType = getUserAccountType(account);
  const userAccountCategory = getUserAccountCategory(account, keyringsMetadata);
  return {
    user_account_type: userAccountType,
    user_account_category: userAccountCategory,
  };
}

export function formatDefaultShieldSubscriptionRequestEventProps(params: CaptureShieldSubscriptionRequestParams) {
  const defaultBillingInterval = getBillingIntervalForSegment(params.defaultBillingInterval);
  const selectedBillingInterval = getBillingIntervalForSegment(params.billingInterval);
  const billingCycles = getBillingCyclesForSegment(params.defaultBillingInterval);

  return {
    subscription_state: params.subscriptionState,
    default_payment_type: params.defaultPaymentType,
    default_payment_currency: params.defaultPaymentCurrency,
    default_billing_interval: defaultBillingInterval,
    default_payment_chain: params.defaultPaymentChain,
    payment_type: params.paymentType,
    payment_currency: params.paymentCurrency,
    is_trial: params.isTrialSubscription,
    billing_interval: selectedBillingInterval,
    billing_cycles: billingCycles,
    payment_chain: params.paymentChain,
  };
}
