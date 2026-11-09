import type { Transaction as KeyringTransaction } from '@metamask/keyring-api';
import { getCleanAppState } from '../../../helpers';
import {
  pausePersistence,
  readStorage,
  reloadExtension,
  type DataStorage,
  type SplitStateStorage,
  type StoredState,
} from '../../state-persistence/helpers';
import {
  STELLAR_ACCOUNT_ADDRESS,
  STELLAR_CHAIN_ID,
} from '../../stellar/mocks/common-stellar';
import { Driver } from '../../../webdriver/driver';

type StellarAccountLookupState = {
  metamask?: {
    internalAccounts?: {
      accounts?: Record<
        string,
        { id: string; address?: string; type?: string }
      >;
    };
  };
};

/**
 * Resolves the internal account id for the default E2E Stellar address.
 *
 * @param driver - WebDriver instance.
 */
export async function getStellarAccountId(driver: Driver): Promise<string> {
  const state = (await getCleanAppState(driver)) as StellarAccountLookupState;
  const accounts = Object.values(
    state.metamask?.internalAccounts?.accounts ?? {},
  );
  const stellarAccount = accounts.find(
    (account) => account.address === STELLAR_ACCOUNT_ADDRESS,
  );
  if (!stellarAccount?.id) {
    throw new Error(
      `Stellar account ${STELLAR_ACCOUNT_ADDRESS} not found in internalAccounts`,
    );
  }
  return stellarAccount.id;
}

async function writeStorage(
  driver: Driver,
  storage: StoredState,
): Promise<void> {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    browser.storage.local
      .set(${JSON.stringify(storage)})
      .then(() => callback({ ok: true }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(String(result.error));
  }
}

function patchMultichainTransactions(
  storage: StoredState,
  accountId: string,
  transactions: KeyringTransaction[],
): void {
  const entry = {
    transactions,
    next: null,
    lastUpdated: Date.now(),
  };

  if ('data' in storage && storage.data) {
    const dataStorage = storage as DataStorage;
    const controller = (dataStorage.data.MultichainTransactionsController ??
      {}) as {
      nonEvmTransactions?: Record<string, Record<string, unknown>>;
    };
    controller.nonEvmTransactions = {
      ...(controller.nonEvmTransactions ?? {}),
      [accountId]: {
        ...(controller.nonEvmTransactions?.[accountId] ?? {}),
        [STELLAR_CHAIN_ID]: entry,
      },
    };
    dataStorage.data.MultichainTransactionsController = controller;
    return;
  }

  const splitStorage = storage as SplitStateStorage;
  const controller = (splitStorage.MultichainTransactionsController ?? {}) as {
    nonEvmTransactions?: Record<string, Record<string, unknown>>;
  };
  controller.nonEvmTransactions = {
    ...(controller.nonEvmTransactions ?? {}),
    [accountId]: {
      ...(controller.nonEvmTransactions?.[accountId] ?? {}),
      [STELLAR_CHAIN_ID]: entry,
    },
  };
  splitStorage.MultichainTransactionsController = controller;
}

/**
 * Seeds MultichainTransactionsController with Stellar keyring transactions.
 *
 * Horizon cannot express Pending (`Unconfirmed`); Failed can come from Horizon,
 * but seeding both statuses here keeps the status E2E deterministic. Snap sync
 * merges by id, so empty Horizon pages leave these rows in place after reload.
 *
 * @param driver - WebDriver instance.
 * @param transactions - Keyring transactions to seed for the Stellar account.
 */
export async function seedStellarMultichainTransactions(
  driver: Driver,
  transactions: KeyringTransaction[],
): Promise<void> {
  const accountId = await getStellarAccountId(driver);
  const keyedTransactions = transactions.map((transaction) => ({
    ...transaction,
    account: accountId,
  }));

  await pausePersistence(driver);
  const storage = await readStorage(driver);
  patchMultichainTransactions(storage, accountId, keyedTransactions);
  await writeStorage(driver, storage);
  await reloadExtension(driver);
}
