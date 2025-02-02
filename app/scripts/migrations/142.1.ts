import { NetworkConfiguration } from '@metamask/network-controller';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 142.1;

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
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing AccountsController.`),
    );
    return state;
  }

  const accountsControllerState = state.AccountsController;
  if (!isObject(accountsControllerState)) {
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
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Invalid or missing selectedAccount.`),
    );
    return state;
  }

  const { selectedAccount } = internalAccounts;

  if (!hasProperty(state, 'NetworkController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing NetworkController.`),
    );
    return state;
  }

  const networkControllerState = state.NetworkController;
  if (!isObject(networkControllerState)) {
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
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Could not find chainId for networkClientId '${selectedNetworkClientId}'.`,
      ),
    );
    return state;
  }

  if (!hasProperty(state, 'TokensController')) {
    global.sentry?.captureException?.(
      new Error(`Migration ${version}: Missing TokensController.`),
    );
    return state;
  }

  const tokensControllerState = state.TokensController;
  if (!isObject(tokensControllerState)) {
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
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Missing or invalid TokensController.allTokens.`,
      ),
    );
    return state;
  }

  const { allTokens } = tokensControllerState;
  const allTokensForChain = allTokens[currentChainId];
  if (!isObject(allTokensForChain)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: allTokens["${currentChainId}"] is missing or not an object.`,
      ),
    );
    return state;
  }

  const accountTokens = allTokensForChain[selectedAccount];
  if (!Array.isArray(accountTokens)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: allTokens["${currentChainId}"]["${selectedAccount}"] is not an array; skipping migration.`,
      ),
    );
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
  global.sentry?.captureException?.(
    new Error(
      `Migration ${version}: No chainId found for "${networkClientId}".`,
    ),
  );
  return undefined;
}
