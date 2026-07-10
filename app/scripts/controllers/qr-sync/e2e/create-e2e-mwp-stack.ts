import log from 'loglevel';
import { DappClient } from '@metamask/mobile-wallet-protocol-dapp-client';
import { E2eMwpMockClient } from './e2e-mwp-mock-client';
import { MobileWalletSimulator } from './mobile-wallet-simulator';
import { registerQrSyncE2eBridge } from './qr-sync-e2e-bridge';

/**
 * Creates the in-extension MWP mock stack for QrSync E2E tests.
 */
export async function createE2eMwpStack(): Promise<{
  transport: null;
  sessionStore: null;
  dappClient: DappClient;
}> {
  const client = new E2eMwpMockClient();
  const simulator = new MobileWalletSimulator(client);
  simulator.bind();
  registerQrSyncE2eBridge(simulator);

  log.debug('QrSync E2E: mock MWP stack initialized');

  return {
    transport: null,
    sessionStore: null,
    dappClient: client,
  };
}
