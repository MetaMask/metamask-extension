import { InternalAccount } from '@metamask/eth-snap-keyring';
import { sha256FromString } from 'ethereumjs-util';
import { v4 as uuid } from 'uuid';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 97;

/**
 * This migration does the following:
 *
 * - Creates a default state for AccountsController.
 * - Moves identites and selectedAddress from the PreferencesController to the AccountsController state.
 * - Removes identites and selectedAddress from the PreferencesController
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
  moveIdentitiesToAccountsController(state);
  moveSelectedAddressToAccountsController(state);
  removeIdentitiesAndSelectedAddressFromPreferencesController(state);
}

function createDefaultAccountsController(state: Record<string, any>) {
  state.AccountsController = {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  };
}

function moveIdentitiesToAccountsController(state: Record<string, any>) {
  const identities: {
    [key: string]: {
      name: string;
      lastSelected: number;
    };
  } = state.PreferencesController?.identities || {};

  const { keyrings }: { keyrings: { type: string; accounts: string[] }[] } =
    state.KeyringController;

  if (Object.keys(identities).length === 0) {
    return;
  }

  const accounts: Record<string, InternalAccount> = {};

  keyrings.forEach((keyring) => {
    keyring.accounts.forEach((address) => {
      const expectedId = uuid({
        random: sha256FromString(address).slice(0, 16),
      });

      const identity = identities[address];

      if (!identity) {
        throw new Error(
          `Missing account name for ${address} in PreferencesControllerState`,
        );
      }

      accounts[expectedId] = {
        address,
        id: expectedId,
        name: identity.name,
        options: {},
        metadata: {
          lastSelected: identity.lastSelected ?? null,
          keyring: {
            type: keyring.type,
          },
        },
        supportedMethods: [
          'personal_sign',
          'eth_sendTransaction',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData',
          'eth_signTypedData_v1',
          'eth_signTypedData_v2',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      };
    });
  });

  state.AccountsController.internalAccounts.accounts = accounts;
}

function moveSelectedAddressToAccountsController(state: Record<string, any>) {
  const selectedAddress = state.PreferencesController?.selectedAddress;

  const selectedAccount = Object.values<InternalAccount>(
    state.AccountsController.internalAccounts.accounts,
  ).find((account: InternalAccount) => {
    return account.address.toLowerCase() === selectedAddress.toLowerCase();
  }) as InternalAccount;

  if (selectedAccount) {
    state.AccountsController.internalAccounts = {
      ...state.AccountsController.internalAccounts,
      selectedAccount: selectedAccount.id,
    };
  }
}

function removeIdentitiesAndSelectedAddressFromPreferencesController(
  state: Record<string, any>,
) {
  delete state.PreferencesController.identities;
  delete state.PreferencesController.selectedAddress;
}
