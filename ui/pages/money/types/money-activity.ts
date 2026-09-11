import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

/**
 * Card spends, cashback, and refunds from the Accounts API. These are not
 * created in this client, so they never reach TransactionController.
 */
type AccountsApiSettlement = {
  /** On-chain tx hash. Combined with `kind` for the activity row id. */
  hash: Hex;
  /** Settlement time, epoch ms (parsed from the API's ISO timestamp). */
  time: number;
  chainId: Hex;
  token: {
    address: Hex;
    symbol: string;
    decimals: number;
  };
  /** Raw, minimal-unit amount of the settlement transfer. */
  amount: string;
};

export type AccountsApiActivity =
  | (AccountsApiSettlement & {
      kind: 'card';
      paidTo: Hex;
    })
  | (AccountsApiSettlement & {
      kind: 'cashback';
      receivedFrom: Hex;
    })
  | (AccountsApiSettlement & {
      kind: 'refund';
      receivedFrom: Hex;
    });

export type OnchainMoneyActivityItem = {
  kind: 'onchain';
  id: string;
  time: number;
  tx: TransactionMeta;
};

export type AccountsApiMoneyActivityItem = {
  kind: 'accountsApi';
  id: string;
  time: number;
  tx: AccountsApiActivity;
};

/**
 * One row in the Money activity list, tagged by source.
 */
export type MoneyActivityItem =
  | OnchainMoneyActivityItem
  | AccountsApiMoneyActivityItem;

export const onchainItem = (tx: TransactionMeta): OnchainMoneyActivityItem => ({
  kind: 'onchain',
  id: tx.id,
  time: tx.time ?? 0,
  tx,
});

/**
 * Wraps an Accounts API settlement as a list item. The id is kind-qualified
 * so a same-hash purchase and cashback cannot collide as React keys.
 *
 * @param tx - Parsed Accounts API activity.
 * @returns A source-tagged activity item.
 */
export const accountsApiItem = (
  tx: AccountsApiActivity,
): AccountsApiMoneyActivityItem => ({
  kind: 'accountsApi',
  id: `${tx.kind}:${tx.hash}`,
  time: tx.time,
  tx,
});

export function isOnchainMoneyActivityItem(
  item: MoneyActivityItem,
): item is OnchainMoneyActivityItem {
  return item.kind === 'onchain';
}

export function isAccountsApiMoneyActivityItem(
  item: MoneyActivityItem,
): item is AccountsApiMoneyActivityItem {
  return item.kind === 'accountsApi';
}
