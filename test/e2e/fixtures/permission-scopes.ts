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
 * Builds a CAIP-25 caveat value permitting the given Solana scopes for the
 * given Solana account address.
 *
 * A default Solana Wallet Standard connect grants non-test networks only, so
 * seeding is the only way for a dapp to hold the Devnet scope. The Wallet
 * Standard restores a seeded session silently, so pair seeded scopes with
 * `connectSolanaTestDapp(driver, testDapp, { expectExistingSession: true })`.
 *
 * @param scopes - The Solana CAIP chain IDs to permit. Defaults to Mainnet.
 * @param solanaAccountAddress - The Solana account address to permit. Defaults
 * to the default fixture Solana account.
 * @returns A CAIP-25 caveat value for fixture seeding.
 */
export function buildSolanaFixtureScopes(
  scopes: string[] = [SolScope.Mainnet],
  solanaAccountAddress: string = DEFAULT_FIXTURE_SOLANA_ACCOUNT,
) {
  const optionalScopes: Record<string, { accounts: string[] }> = {};
  for (const scope of scopes) {
    optionalScopes[scope] = {
      accounts: [`${scope}:${solanaAccountAddress}`],
    };
  }
  return {
    isMultichainOrigin: true,
    requiredScopes: {},
    optionalScopes,
    sessionProperties: {},
  };
}

const EVM_LOCALHOST_EIP1193_FIXTURE_SCOPES = buildEvmEip1193FixtureScopes([
  1337,
]);

export const EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE = {
  ...EVM_LOCALHOST_EIP1193_FIXTURE_SCOPES,
  optionalScopes: {
    ...EVM_LOCALHOST_EIP1193_FIXTURE_SCOPES.optionalScopes,
    ...buildSolanaFixtureScopes().optionalScopes,
  },
};

export const EVM_AND_SOLANA_FIXTURE_SCOPES_WITHOUT_EIP1193_COMPATIBLE = {
  ...EVM_AND_SOLANA_FIXTURE_SCOPES_WITH_EIP1193_COMPATIBLE,
  sessionProperties: {},
};
