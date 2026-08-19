import { SolScope } from '@metamask/keyring-api';

import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
} from '../constants';

/**
 * CAIP-25 caveat values for seeding dapp permissions through
 * `FixtureBuilderV2.withPermissionControllerConnectedToTestDapp({ scopes })`.
 *
 * Dapp network permissions can no longer be edited from the wallet UI, so
 * tests that need a specific set of permitted scopes must seed them here
 * instead of driving a post-connect edit flow.
 */

export const EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE = {
  isMultichainOrigin: true,
  requiredScopes: {},
  optionalScopes: {
    'eip155:1337': {
      accounts: [`eip155:1337:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`],
    },
    'wallet:eip155': {
      accounts: [`wallet:eip155:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`],
    },
    [SolScope.Mainnet]: {
      accounts: [`${SolScope.Mainnet}:${DEFAULT_FIXTURE_SOLANA_ACCOUNT}`],
    },
  },
  sessionProperties: { 'eip1193-compatible': true },
};

export const EVM_AND_SOLANA_FIXTURE_SCOPES_WITHOUT_EIP1193_COMPATIBLE = {
  ...EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE,
  sessionProperties: {},
};

/**
 * Builds a CAIP-25 caveat value permitting the given EVM chains (plus the
 * `wallet:eip155` scope) for the default fixture account, marked
 * EIP-1193-compatible so the dapp's `window.ethereum` provider is authorized
 * without a live connect approval.
 *
 * @param chainIds - Decimal EVM chain IDs to permit.
 * @returns A CAIP-25 caveat value for fixture seeding.
 */
export function buildEvmEip1193FixtureScopes(chainIds: number[]) {
  const optionalScopes: Record<string, { accounts: string[] }> = {
    'wallet:eip155': {
      accounts: [`wallet:eip155:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`],
    },
  };
  for (const chainId of chainIds) {
    const scopeKey = `eip155:${chainId}`;
    optionalScopes[scopeKey] = {
      accounts: [`${scopeKey}:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`],
    };
  }
  return {
    isMultichainOrigin: true,
    requiredScopes: {},
    optionalScopes,
    sessionProperties: { 'eip1193-compatible': true },
  };
}

/**
 * Builds a CAIP-25 caveat value permitting only the Solana Mainnet scope for
 * the given Solana account address.
 *
 * @param solanaAccountAddress - The Solana account address to permit.
 * @returns A CAIP-25 caveat value for fixture seeding.
 */
export function buildSolanaMainnetFixtureScopes(solanaAccountAddress: string) {
  return {
    isMultichainOrigin: true,
    requiredScopes: {},
    optionalScopes: {
      [SolScope.Mainnet]: {
        accounts: [`${SolScope.Mainnet}:${solanaAccountAddress}`],
      },
    },
    sessionProperties: {},
  };
}

/**
 * Builds a CAIP-25 caveat value permitting the Solana Mainnet and Devnet
 * scopes for the given Solana account address. Seeding both scopes is the
 * only way for a dapp to hold Devnet permission, since a default Solana
 * Wallet Standard connect grants non-test networks only. The Wallet Standard
 * restores a seeded session silently, so pair this with
 * `connectSolanaTestDapp(driver, testDapp, { expectExistingSession: true })`.
 *
 * @param solanaAccountAddress - The Solana account address to permit.
 * @returns A CAIP-25 caveat value for fixture seeding.
 */
export function buildSolanaMainnetAndDevnetFixtureScopes(
  solanaAccountAddress: string,
) {
  return {
    isMultichainOrigin: true,
    requiredScopes: {},
    optionalScopes: {
      [SolScope.Mainnet]: {
        accounts: [`${SolScope.Mainnet}:${solanaAccountAddress}`],
      },
      [SolScope.Devnet]: {
        accounts: [`${SolScope.Devnet}:${solanaAccountAddress}`],
      },
    },
    sessionProperties: {},
  };
}
