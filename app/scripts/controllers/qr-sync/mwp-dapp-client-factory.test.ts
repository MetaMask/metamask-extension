/**
 * @jest-environment node
 */
import {
  SessionStore,
  WebSocketTransport,
  type IKVStore,
} from '@metamask/mobile-wallet-protocol-core';
import { DappClient } from '@metamask/mobile-wallet-protocol-dapp-client';
import { E2eMwpMockClient } from '../../../../test/e2e/helpers/qr-sync/e2e-mwp-mock-client';
import { MobileWalletSimulator } from '../../../../test/e2e/helpers/qr-sync/mobile-wallet-simulator';
import { registerQrSyncE2eBridge } from '../../../../test/e2e/helpers/qr-sync/qr-sync-e2e-bridge';
import type { KeyManager } from './key-manager';
import {
  createE2eMwpStack,
  createProductionMwpStack,
  getMwpDappClient,
} from './mwp-dapp-client-factory';

const TEST_RELAY_URL = 'wss://test-relay.example/connection/websocket';

const mockKeyStore = {} as IKVStore;

const mockKeyManager: KeyManager = {
  generateKeyPair: jest.fn(),
  validatePeerKey: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

jest.mock('../../../../test/e2e/helpers/qr-sync/qr-sync-e2e-bridge', () => ({
  registerQrSyncE2eBridge: jest.fn(),
}));

jest.mock('@metamask/mobile-wallet-protocol-core', () => ({
  WebSocketTransport: {
    create: jest.fn().mockResolvedValue({ kind: 'mock-transport' }),
  },
  SessionStore: {
    create: jest.fn().mockResolvedValue({ kind: 'mock-session-store' }),
  },
}));

jest.mock('@metamask/mobile-wallet-protocol-dapp-client', () => ({
  DappClient: class MockDappClient {
    kind = 'mock-production-dapp-client';
  },
}));

describe('mwp-dapp-client-factory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createProductionMwpStack', () => {
    it('creates the production transport, session store, and dapp client', async () => {
      const client = await createProductionMwpStack(
        mockKeyStore,
        TEST_RELAY_URL,
        mockKeyManager,
      );

      expect(WebSocketTransport.create).toHaveBeenCalledWith({
        kvstore: mockKeyStore,
        url: TEST_RELAY_URL,
        websocket: WebSocket,
      });
      expect(SessionStore.create).toHaveBeenCalledWith(mockKeyStore);
      expect(client).toBeInstanceOf(DappClient);
      expect(client).toMatchObject({ kind: 'mock-production-dapp-client' });
    });
  });

  describe('createE2eMwpStack', () => {
    it('registers the mobile simulator bridge and returns the mock client', async () => {
      const client = await createE2eMwpStack();

      expect(client).toBeInstanceOf(E2eMwpMockClient);
      expect(registerQrSyncE2eBridge).toHaveBeenCalledTimes(1);
      expect(registerQrSyncE2eBridge).toHaveBeenCalledWith(
        expect.any(MobileWalletSimulator),
      );
      expect(WebSocketTransport.create).not.toHaveBeenCalled();
    });
  });

  describe('getMwpDappClient', () => {
    it('uses the production stack when running under Jest', async () => {
      const client = await getMwpDappClient(
        mockKeyStore,
        TEST_RELAY_URL,
        mockKeyManager,
      );

      expect(WebSocketTransport.create).toHaveBeenCalled();
      expect(registerQrSyncE2eBridge).not.toHaveBeenCalled();
      expect(client).toMatchObject({ kind: 'mock-production-dapp-client' });
    });
  });
});
