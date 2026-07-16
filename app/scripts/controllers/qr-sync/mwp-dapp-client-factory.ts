import {
  type IKVStore,
  SessionStore,
  WebSocketTransport,
} from '@metamask/mobile-wallet-protocol-core';
import { DappClient } from '@metamask/mobile-wallet-protocol-dapp-client';
import type { KeyManager } from './key-manager';

export type MwpStackFactoryOptions = {
  kvStore: IKVStore;
  relayUrl: string;
  keyManager: KeyManager;
};

function shouldUseE2eMwpStack(): boolean {
  // Jest unit tests set IN_TEST but must keep using mocked production MWP packages.
  return Boolean(process.env.IN_TEST) && typeof jest === 'undefined';
}

/**
 * Creates the production MWP transport, session store, and dapp client stack.
 *
 * @param keyStore - The key store to use for the MWP stack.
 * @param relayUrl - The relay URL to use for the MWP stack.
 * @param keyManager - The key manager to use for the MWP stack.
 * @returns The MWP dapp client.
 */
export async function createProductionMwpStack(
  keyStore: IKVStore,
  relayUrl: string,
  keyManager: KeyManager,
): Promise<DappClient> {
  const transport = await WebSocketTransport.create({
    kvstore: keyStore,
    url: relayUrl,
    websocket: typeof WebSocket === 'undefined' ? undefined : WebSocket,
  });

  const sessionStore = await SessionStore.create(keyStore);

  return new DappClient({
    transport,
    sessionstore: sessionStore,
    keymanager: keyManager,
  });
}

/**
 * Creates the in-extension MWP mock stack for QrSync E2E tests.
 */
export async function createE2eMwpStack(): Promise<DappClient> {
  // Use `require` (not `import`) so this test-only code is dead-code-eliminated from production builds.
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require */
  const {
    E2eMwpMockClient,
  } = require('../../../../test/e2e/helpers/qr-sync/e2e-mwp-mock-client');
  const {
    MobileWalletSimulator,
  } = require('../../../../test/e2e/helpers/qr-sync/mobile-wallet-simulator');
  const {
    registerQrSyncE2eBridge,
  } = require('../../../../test/e2e/helpers/qr-sync/qr-sync-e2e-bridge');
  /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require */

  const client = new E2eMwpMockClient();
  const simulator = new MobileWalletSimulator(client);
  simulator.bind();
  registerQrSyncE2eBridge(simulator);

  return client;
}

/**
 * Returns the MWP stack for the current environment.
 * In extension test builds (`IN_TEST`, not Jest), uses the E2E mock client.
 *
 * @param keyStore - The key store to use for the MWP stack.
 * @param relayUrl - The relay URL to use for the MWP stack.
 * @param keyManager - The key manager to use for the MWP stack.
 * @returns The MWP dapp client for the current environment.
 */
export async function getMwpDappClient(
  keyStore: IKVStore,
  relayUrl: string,
  keyManager: KeyManager,
): Promise<DappClient> {
  if (shouldUseE2eMwpStack()) {
    return createE2eMwpStack();
  }

  return createProductionMwpStack(keyStore, relayUrl, keyManager);
}
