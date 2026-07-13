import {
  type IKVStore,
  SessionStore,
  WebSocketTransport,
} from '@metamask/mobile-wallet-protocol-core';
import { DappClient } from '@metamask/mobile-wallet-protocol-dapp-client';
import type { KeyManager } from './key-manager';
import { registerQrSyncE2eBridge } from './mocks/qr-sync-e2e-bridge';
import { MobileWalletSimulator } from './mocks/mobile-wallet-simulator';
import { E2eMwpMockClient } from './mocks/e2e-mwp-mock-client';

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
 * @param options0
 * @param options0.kvStore
 * @param options0.relayUrl
 * @param options0.keyManager
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
  const client = new E2eMwpMockClient();
  const simulator = new MobileWalletSimulator(client);
  simulator.bind();
  registerQrSyncE2eBridge(simulator);

  return client;
}

/**
 * Returns the MWP stack for the current environment.
 * In extension test builds (`IN_TEST`, not Jest), uses the E2E mock client.
 * @param options
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
