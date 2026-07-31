import type {
  IKeyManager,
  ISessionStore,
  ITransport,
  KeyPair,
} from '@metamask/mobile-wallet-protocol-core';

type TransportListener = (...args: unknown[]) => void;

/**
 * Minimal {@link ITransport} for E2E mocks.
 * `BaseClient` registers `error` and `message` listeners in its constructor.
 */
export class E2eMwpStubTransport implements ITransport {
  readonly #listeners = new Map<string, Set<TransportListener>>();

  on(
    event: 'message' | 'connecting' | 'connected' | 'disconnected' | 'error',
    handler:
      | ((payload: { channel: string; data: string }) => void)
      | (() => void)
      | ((error: Error) => void),
  ): void {
    const handlers = this.#listeners.get(event) ?? new Set();
    handlers.add(handler as TransportListener);
    this.#listeners.set(event, handlers);
  }

  async connect(): Promise<void> {
    // No-op mock implementation
  }

  async disconnect(): Promise<void> {
    // No-op mock implementation
  }

  async publish(): Promise<boolean> {
    return true;
  }

  async subscribe(_channel: string): Promise<void> {
    // No-op mock implementation
  }

  async clear(_channel: string): Promise<void> {
    // No-op mock implementation
  }
}

export function createE2eMwpStubSessionStore(): ISessionStore {
  return {
    set: async () => {
      // No-op mock implementation
    },
    get: async () => null,
    list: async () => [],
    delete: async () => {
      // No-op mock implementation
    },
  };
}

function createEmptyKeyPair(): KeyPair {
  return {
    publicKey: new Uint8Array(32),
    privateKey: new Uint8Array(32),
  };
}

export function createE2eMwpStubKeyManager(): IKeyManager {
  return {
    generateKeyPair: createEmptyKeyPair,
    encrypt: async (plaintext) => plaintext,
    decrypt: async (encryptedB64) => encryptedB64,
    validatePeerKey: () => undefined,
  };
}

export const E2E_MWP_STUB_TRANSPORT = new E2eMwpStubTransport();
export const E2E_MWP_STUB_SESSION_STORE = createE2eMwpStubSessionStore();
export const E2E_MWP_STUB_KEY_MANAGER = createE2eMwpStubKeyManager();
