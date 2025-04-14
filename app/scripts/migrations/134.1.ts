import { AccountsControllerState } from '@metamask/accounts-controller';
import { NetworkConfiguration } from '@metamask/network-controller';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 134.1;

/**
 * This migration attempts to reset `TokensController.tokens` to the list of tokens
 * found in `TokensController.allTokens[currentChainId][selectedAccount]`. The
 * `currentChainId` is determined by matching the `selectedNetworkClientId` to a
 * chain's RPC endpoints in `networkConfigurationsByChainId`.
 *
 * If any step fails (missing or invalid state), the migration is skipped, and
 * the original state is returned as-is (after logging an error to Sentry).
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
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
  if (!hasProperty(state, 'AccountsController')) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing AccountsController.`),
    );
    return state;
  }

  const accountsControllerState =
    state.AccountsController as AccountsControllerState;
  if (!isObject(accountsControllerState)) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: AccountsController is type '${typeof accountsControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(accountsControllerState, 'internalAccounts') ||
    !isObject(accountsControllerState.internalAccounts)
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Missing or invalid AccountsController.internalAccounts.`,
      ),
    );
    return state;
  }

  const { internalAccounts } = accountsControllerState;
  if (
    !hasProperty(internalAccounts, 'selectedAccount') ||
    typeof internalAccounts.selectedAccount !== 'string' ||
    internalAccounts.selectedAccount === ''
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Invalid or missing selectedAccount.`),
    );
    return state;
  }

  // NEW: Extract the selected account's address from internalAccounts.accounts
  if (
    !hasProperty(internalAccounts, 'accounts') ||
    !isObject(internalAccounts.accounts)
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Missing or invalid internalAccounts.accounts.`,
      ),
    );
    return state;
  }
  const { accounts } = internalAccounts;
  const selectedAccountKey = internalAccounts.selectedAccount;
  if (
    !hasProperty(accounts, selectedAccountKey) ||
    !isObject(accounts[selectedAccountKey])
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Selected account entry not found in internalAccounts.accounts.`,
      ),
    );
    return state;
  }
  const selectedAccountEntry = accounts[selectedAccountKey];
  if (
    !hasProperty(selectedAccountEntry, 'address') ||
    typeof selectedAccountEntry.address !== 'string' ||
    selectedAccountEntry.address === ''
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid or missing address in selected account entry.`,
      ),
    );
    return state;
  }
  const selectedAccountAddress = selectedAccountEntry.address;

  if (!hasProperty(state, 'NetworkController')) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing NetworkController.`),
    );
    return state;
  }

  const networkControllerState = state.NetworkController;
  if (!isObject(networkControllerState)) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController is type '${typeof networkControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(networkControllerState, 'selectedNetworkClientId') ||
    typeof networkControllerState.selectedNetworkClientId !== 'string' ||
    !networkControllerState.selectedNetworkClientId
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Invalid or missing selectedNetworkClientId.`,
      ),
    );
    return state;
  }

  const { selectedNetworkClientId } = networkControllerState;

  if (
    !hasProperty(networkControllerState, 'networkConfigurationsByChainId') ||
    !isObject(networkControllerState.networkConfigurationsByChainId)
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Missing or invalid networkConfigurationsByChainId.`,
      ),
    );
    return state;
  }

  const { networkConfigurationsByChainId } = networkControllerState;

  const currentChainId = getChainIdForNetworkClientId(
    networkConfigurationsByChainId as Record<string, NetworkConfiguration>,
    selectedNetworkClientId,
  );

  if (!currentChainId) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Could not find chainId for networkClientId '${selectedNetworkClientId}'.`,
      ),
    );
    return state;
  }

  if (!hasProperty(state, 'TokensController')) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing TokensController.`),
    );
    return state;
  }

  const tokensControllerState = state.TokensController;
  if (!isObject(tokensControllerState)) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: TokensController is type '${typeof tokensControllerState}', expected object.`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(tokensControllerState, 'allTokens') ||
    !isObject(tokensControllerState.allTokens)
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Missing or invalid TokensController.allTokens.`,
      ),
    );
    return state;
  }

  const { tokens } = tokensControllerState;
  const { allTokens } = tokensControllerState;
  const allTokensForChain = allTokens[currentChainId];

  if (
    Array.isArray(tokens) &&
    tokens.length > 0 &&
    !isObject(allTokensForChain)
  ) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: tokens is not an empty array, but allTokensForChain is not an object.`,
      ),
    );
    return state;
  }

  if (!isObject(allTokensForChain)) {
    return state;
  }

  const accountTokens = allTokensForChain[selectedAccountAddress];
  if (!Array.isArray(accountTokens)) {
    return state;
  }

  tokensControllerState.tokens = accountTokens;
  return state;
}

function getChainIdForNetworkClientId(
  networkConfigurationsByChainId: Record<string, NetworkConfiguration>,
  networkClientId: string,
): string | undefined {
  for (const [chainId, networkConfiguration] of Object.entries(
    networkConfigurationsByChainId,
  )) {
    if (Array.isArray(networkConfiguration.rpcEndpoints)) {
      for (const endpoint of networkConfiguration.rpcEndpoints) {
        if (endpoint.networkClientId === networkClientId) {
          return chainId;
        }
      }
    }
  }
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  global.sentry?.captureException?.(
    new Error(
      `Migration ${version}: No chainId found for "${networkClientId}".`,
    ),
  );
  return undefined;
}
