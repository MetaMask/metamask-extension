import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import type { Migrate } from './types';

export const version = 234;

/**
 * Migration 234: backfill the `defaultMoneyAccountId` state field introduced
 * with `@metamask/money-account-controller@2.0.0`.
 *
 * The controller sets `defaultMoneyAccountId` when it creates a money
 * account (defaulting to the first one created). Wallets that already have a
 * money account never create another — `createMoneyAccount` returns the
 * existing account idempotently — so without this migration the default stays
 * `null` forever for them, and `getMoneyAccount()` with no selector, which
 * resolves the default account, returns `undefined`.
 *
 * A wallet can hold at most one money account today (the SFA account for the
 * primary entropy source), so when exactly one account exists its ID becomes
 * the default. Wallets with no account — or more than one, which cannot occur
 * today — keep the default unset; the controller fills it in on the next
 * account creation.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were
 * modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (!hasProperty(data, 'MoneyAccountController')) {
    return;
  }

  const moneyAccountController = data.MoneyAccountController;

  if (!isObject(moneyAccountController)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid MoneyAccountController state: '${typeof moneyAccountController}'`,
      ),
    );
    return;
  }

  if (!hasProperty(moneyAccountController, 'moneyAccounts')) {
    captureException(
      new Error(
        `Migration ${version}: Missing moneyAccounts property from MoneyAccountController`,
      ),
    );
    return;
  }

  const { moneyAccounts, defaultMoneyAccountId } = moneyAccountController;

  if (!isObject(moneyAccounts)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid moneyAccounts state: '${typeof moneyAccounts}'`,
      ),
    );
    return;
  }

  const accountIds = Object.keys(moneyAccounts);

  // Leave any existing default — or a state with no account or more than one
  // (which cannot occur today) — untouched; the controller decides the default
  // on the next account creation.
  if (defaultMoneyAccountId || accountIds.length !== 1) {
    return;
  }

  moneyAccountController.defaultMoneyAccountId = accountIds[0];
  changedControllers.add('MoneyAccountController');
}) satisfies Migrate;
