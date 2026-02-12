import { cloneDeep } from 'lodash';
import { hasProperty, Hex, isObject } from '@metamask/utils';
import { isEvmAccountType } from '@metamask/keyring-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import {
  TokenBalancesControllerState,
  TokensControllerState,
} from '@metamask/assets-controllers';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 162;

/**
 * This migration removes from the TokensController state all tokens that belong to an EVM account that has been removed.
 *
 * Also removed from TokenBalancesController all balances that belong to an EVM account that has been removed.
 *
 * If the Tokens is not found or is not an object, the migration logs an error,
 * but otherwise leaves the state unchanged.
 *
 * @param originalVersionedData - The versioned extension state.
 * @returns The updated versioned extension state without the tokens property.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  versionedData.data = transformState(versionedData.data);

  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  if (!hasProperty(state, 'TokensController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: TokensController not found.`),
    );
    return state;
  }

  if (!hasProperty(state, 'AccountsController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: AccountsController not found.`),
    );
    return state;
  }

  if (!hasProperty(state, 'TokenBalancesController')) {
    return state;
  }

  const tokensControllerState = state.TokensController as TokensControllerState;
  const tokenBalancesControllerState =
    state.TokenBalancesController as TokenBalancesControllerState;
  const accountsControllerState =
    state.AccountsController as AccountsControllerState;

  if (!isObject(tokensControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: TokensController is type '${typeof tokensControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (!isObject(tokenBalancesControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: TokenBalancesController is type '${typeof tokenBalancesControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (!isObject(accountsControllerState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController is type '${typeof accountsControllerState}', expected object.`,
      ),
    );
    return state;
  }

  const { internalAccounts } = accountsControllerState;

  const accounts = Object.values(internalAccounts.accounts);
  const evmAccounts = accounts.filter((account) =>
    isEvmAccountType(account.type),
  );
  const evmAccountAddresses = evmAccounts.map((account) => account.address);

  // Check and clean up tokens in allTokens that do not belong to any EVM account
  if (hasProperty(tokensControllerState, 'allTokens')) {
    for (const chainId of Object.keys(tokensControllerState.allTokens)) {
      const tokensByAccounts =
        tokensControllerState.allTokens[chainId as `0x${string}`];
      for (const account of Object.keys(tokensByAccounts)) {
        if (!evmAccountAddresses.includes(account)) {
          delete tokensControllerState.allTokens[chainId as `0x${string}`][
            account
          ];
        }
      }
    }
  }

  // Check and clean up tokens in allDetectedTokens that do not belong to any EVM account
  if (hasProperty(tokensControllerState, 'allDetectedTokens')) {
    for (const chainId of Object.keys(
      tokensControllerState.allDetectedTokens,
    )) {
      const tokensByAccounts =
        tokensControllerState.allDetectedTokens[chainId as `0x${string}`];

      for (const account of Object.keys(tokensByAccounts)) {
        if (!evmAccountAddresses.includes(account)) {
          delete tokensControllerState.allDetectedTokens[
            chainId as `0x${string}`
          ][account];
        }
      }
    }
  }

  // Check and clean up tokens in allIgnoredTokens that do not belong to any EVM account
  if (hasProperty(tokensControllerState, 'allIgnoredTokens')) {
    for (const chainId of Object.keys(tokensControllerState.allIgnoredTokens)) {
      const tokensByAccounts =
        tokensControllerState.allIgnoredTokens[chainId as `0x${string}`];
      for (const account of Object.keys(tokensByAccounts)) {
        if (!evmAccountAddresses.includes(account)) {
          delete tokensControllerState.allIgnoredTokens[
            chainId as `0x${string}`
          ][account];
        }
      }
    }
  }

  // Check and clean up balances in tokenBalancesControllerState that do not belong to any EVM account
  if (hasProperty(tokenBalancesControllerState, 'tokenBalances')) {
    for (const accountAddress of Object.keys(
      tokenBalancesControllerState.tokenBalances,
    )) {
      if (!evmAccountAddresses.includes(accountAddress)) {
        delete tokenBalancesControllerState.tokenBalances[
          accountAddress as Hex
        ];
      }
    }
  }

  return state;
}
