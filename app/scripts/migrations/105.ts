import { EthAccountType, InternalAccount } from '@metamask/keyring-api';
import { sha256FromString } from 'ethereumjs-util';
import { v4 as uuid } from 'uuid';
import { cloneDeep } from 'lodash';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type Identity = {
  name: string;
  address: string;
  lastSelected?: number;
};

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

function findInternalAccountByAddress(
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>,
  address: string,
): InternalAccount | undefined {
  return Object.values<InternalAccount>(
    state.AccountsController.internalAccounts.accounts,
  ).find(
    (account: InternalAccount) =>
      account.address.toLowerCase() === address.toLowerCase(),
  );
}

// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createDefaultAccountsController(state: Record<string, any>) {
  state.AccountsController = {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  };
}

function createInternalAccountsForAccountsController(
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        importTime: 0,
        keyring: {
          // This is default HD Key Tree type because the keyring is encrypted
          // during migration, the type will get updated when the during the
          // initial updateAccounts call.
          type: 'HD Key Tree',
        },
      },
      methods: ETH_EOA_METHODS,
      type: EthAccountType.Eoa,
    };
  });

  state.AccountsController.internalAccounts.accounts = accounts;
}

function getFirstAddress(
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>,
) {
  const [firstAddress] = Object.keys(
    state.PreferencesController?.identities || {},
  );
  return firstAddress;
}

function createSelectedAccountForAccountsController(
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>,
) {
  let selectedAddress = state.PreferencesController?.selectedAddress;

  if (typeof selectedAddress !== 'string') {
    global.sentry?.captureException?.(
      new Error(
        `state.PreferencesController?.selectedAddress is ${selectedAddress}`,
      ),
    );

    // Get the first account if selectedAddress is not a string
    selectedAddress = getFirstAddress(state);
  }

  const selectedAccount = findInternalAccountByAddress(state, selectedAddress);
  if (selectedAccount) {
    // Required in case there was no address selected
    state.PreferencesController.selectedAddress = selectedAccount.address;
    state.AccountsController.internalAccounts = {
      ...state.AccountsController.internalAccounts,
      selectedAccount: selectedAccount.id,
    };
  }
}
