import {
  EthAccountType,
  InternalAccount,
  EthMethod,
} from '@metamask/keyring-api';
import { sha256FromString } from 'ethereumjs-util';
import { v4 as uuid } from 'uuid';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

interface Identity {
  name: string;
  address: string;
  lastSelected?: number;
}

export const version = 105;

/**
 * This migration does the following:
 *
 * - Creates a default state for AccountsController.
 * - Copies identities and selectedAddress from the PreferencesController to
 * the AccountsController state as internal accounts and selectedAccount.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  migrateData(versionedData.data);
  return versionedData;
}

function migrateData(state: Record<string, unknown>): void {
  createDefaultAccountsController(state);
  createInternalAccountsForAccountsController(state);
  createSelectedAccountForAccountsController(state);
}

function createDefaultAccountsController(state: Record<string, any>) {
  state.AccountsController = {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  };
}

function createInternalAccountsForAccountsController(
  state: Record<string, any>,
) {
  const identities: {
    [key: string]: Identity;
  } = state.PreferencesController?.identities || {};

  if (Object.keys(identities).length === 0) {
    return;
  }

  const accounts: Record<string, InternalAccount> = {};

  Object.values(identities).forEach((identity) => {
    const expectedId = uuid({
      random: sha256FromString(identity.address).slice(0, 16),
    });

    accounts[expectedId] = {
      address: identity.address,
      id: expectedId,
      options: {},
      metadata: {
        name: identity.name,
        lastSelected: identity.lastSelected ?? undefined,
        keyring: {
          // This is default HD Key Tree type because the keyring is encrypted
          // during migration, the type will get updated when the during the
          // initial updateAccounts call.
          type: 'HD Key Tree',
        },
      },
      methods: [...Object.values(EthMethod)],
      type: EthAccountType.Eoa,
    };
  });

  state.AccountsController.internalAccounts.accounts = accounts;
}

function createSelectedAccountForAccountsController(
  state: Record<string, any>,
) {
  const selectedAddress = state.PreferencesController?.selectedAddress;

  const selectedAccount = Object.values<InternalAccount>(
    state.AccountsController.internalAccounts.accounts,
  ).find((account: InternalAccount) => {
    return account.address.toLowerCase() === selectedAddress.toLowerCase();
  }) as InternalAccount;

  if (selectedAccount) {
    state.AccountsController.internalAccounts = {
      ...state.AccountsController.internalAccounts,
      selectedAccount: selectedAccount.id ?? '',
    };
  }
}
