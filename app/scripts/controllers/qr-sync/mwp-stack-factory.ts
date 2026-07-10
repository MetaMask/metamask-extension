import {
  type IKVStore,
  SessionStore,
  WebSocketTransport,
} from '@metamask/mobile-wallet-protocol-core';
import { DappClient } from '@metamask/mobile-wallet-protocol-dapp-client';
import type { KeyManager } from './key-manager';
import { createE2eMwpStack } from './e2e/create-e2e-mwp-stack';
import type { QrSyncMwpStack } from './types';

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
export async function createProductionMwpStack({
  kvStore,
  relayUrl,
  keyManager,
}: MwpStackFactoryOptions): Promise<QrSyncMwpStack> {
  const transport = await WebSocketTransport.create({
    kvstore: kvStore,
    url: relayUrl,
    websocket: typeof WebSocket === 'undefined' ? undefined : WebSocket,
  });

  const sessionStore = await SessionStore.create(kvStore);

  const dappClient = new DappClient({
    transport,
    sessionstore: sessionStore,
    keymanager: keyManager,
  });

  return {
    transport,
    sessionStore,
    dappClient,
  };
}

/**
 * Returns the MWP stack for the current environment.
 * In extension test builds (`IN_TEST`, not Jest), uses the E2E mock client.
 * @param options
 */
export async function mwpStackFactory(
  options: MwpStackFactoryOptions,
): Promise<QrSyncMwpStack> {
  if (shouldUseE2eMwpStack()) {
    return createE2eMwpStack();
  }

  return createProductionMwpStack(options);
}
