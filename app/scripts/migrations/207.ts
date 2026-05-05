import { isEvmAccountType } from '@metamask/keyring-api';
import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 207;

const MUSD_ADDRESS = '0xaca92e438df0b2401ff60da7e4337b687a2435da';

const MUSD_TOKEN = {
  address: MUSD_ADDRESS,
  decimals: 6,
  symbol: 'mUSD',
  name: 'MetaMask USD',
};

/**
 * Chain IDs on which mUSD should be shown by default:
 * - `0x1`    — Ethereum mainnet
 * - `0xe708` — Linea
 * - `0x8f`   — Monad mainnet
 */
const MUSD_CHAIN_IDS = ['0x1', '0xe708', '0x8f'];

/**
 * Seed mUSD (`0xaca92e438df0b2401ff60da7e4337b687a2435da`) into
 * `TokensController.allTokens` for every EVM account on Ethereum mainnet
 * (`0x1`), Linea (`0xe708`), and Monad mainnet (`0x8f`).
 *
 * EVM account addresses are sourced from `AccountsController` so that even
 * users who have never tracked any ERC-20 tokens (empty `allTokens`) receive
 * mUSD. Existing token lists are preserved; mUSD is only appended when it is
 * not already present for a given account + network combination
 * (case-insensitive address check).
 *
 * @param versionedData - The versioned MetaMask state object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  // ── Validate AccountsController ────────────────────────────────────────────
  if (
    !hasProperty(versionedData.data, 'AccountsController') ||
    !isObject(versionedData.data.AccountsController)
  ) {
    return;
  }

  const { AccountsController } = versionedData.data;

  if (
    !hasProperty(AccountsController, 'internalAccounts') ||
    !isObject(AccountsController.internalAccounts)
  ) {
    return;
  }

  const { internalAccounts } = AccountsController;

  if (
    !hasProperty(internalAccounts, 'accounts') ||
    !isObject(internalAccounts.accounts)
  ) {
    return;
  }

  // Collect addresses of all EVM accounts.
  const evmAccountAddresses = Object.values(internalAccounts.accounts)
    .filter(
      (account) =>
        isObject(account) &&
        hasProperty(account, 'type') &&
        typeof account.type === 'string' &&
        isEvmAccountType(account.type) &&
        hasProperty(account, 'address') &&
        typeof account.address === 'string',
    )
    .map((account) => (account as { address: string }).address);

  if (evmAccountAddresses.length === 0) {
    return;
  }

  // ── Validate TokensController ───────────────────────────────────────────────
  if (
    !hasProperty(versionedData.data, 'TokensController') ||
    !isObject(versionedData.data.TokensController)
  ) {
    return;
  }

  const { TokensController } = versionedData.data;

  if (
    !hasProperty(TokensController, 'allTokens') ||
    !isObject(TokensController.allTokens)
  ) {
    return;
  }

  const { allTokens } = TokensController;

  // ── Seed mUSD ───────────────────────────────────────────────────────────────
  let mutated = false;

  for (const chainId of MUSD_CHAIN_IDS) {
    if (!isObject(allTokens[chainId])) {
      allTokens[chainId] = {};
    }

    const chainTokens = allTokens[chainId] as Record<string, unknown[]>;

    for (const address of evmAccountAddresses) {
      if (!Array.isArray(chainTokens[address])) {
        chainTokens[address] = [];
      }

      const existing = chainTokens[address] as { address?: string }[];

      // Skip if mUSD is already tracked for this account on this network.
      const alreadyPresent = existing.some(
        (token) =>
          isObject(token) &&
          typeof token.address === 'string' &&
          token.address.toLowerCase() === MUSD_ADDRESS,
      );

      if (!alreadyPresent) {
        chainTokens[address] = [...existing, MUSD_TOKEN];
        mutated = true;
      }
    }
  }

  if (mutated) {
    changedControllers.add('TokensController');
  }
}) satisfies Migrate;
