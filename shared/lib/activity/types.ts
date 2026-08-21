import type {
  ActivityItem,
  ActivityKind as ClientActivityKind,
} from '@metamask/client-utils';

export type {
  Status,
  TokenAmount,
  FiatAmount,
  Fee as ActivityFee,
} from '@metamask/client-utils';

/**
 * Money-account deposits and withdrawals are extension-local activity kinds:
 * `@metamask/client-utils` has no money-account mapping (the transactions are
 * EIP-7702 batches it classifies as `contractInteraction`), so
 * `enrichLocalActivity` re-types them. They reuse the perps MM Pay data shape
 * (`fiat` + `token`) because the rows render the same way: a fiat amount
 * against a product balance.
 */
export type MoneyAccountActivityKind =
  | 'moneyAccountDeposit'
  | 'moneyAccountWithdraw';

export type MoneyAccountActivityItem = Omit<
  Extract<ActivityItem, { type: 'perpsAddFunds' | 'perpsWithdraw' }>,
  'type'
> & {
  type: MoneyAccountActivityKind;
};

export type ActivityKind = ClientActivityKind | MoneyAccountActivityKind;

export type ActivityListItem = ActivityItem | MoneyAccountActivityItem;
