import { IKVStore, ISessionStore, SessionStore, WebSocketTransport } from "@metamask/mobile-wallet-protocol-core";
import { DappClient } from "@metamask/mobile-wallet-protocol-dapp-client";
import { KeyManager } from "./key-manager";
import { QrSyncControllerInitOptions, QrSyncPayload } from "./types";

export class QrSyncController {
  #keyManager: KeyManager;

  #kvStore: IKVStore;

  #transport: WebSocketTransport | null = null;

  #mwpDappClient: DappClient | null = null;

  #sessionStore: ISessionStore | null = null;

  constructor(options: QrSyncControllerInitOptions) {
    this.#keyManager = options.keyManager;
    this.#kvStore = {
      get: () => Promise.resolve(null),
      set: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    };
  }

  async init() {
    // configure transport
    this.#transport = await WebSocketTransport.create({
      kvstore: this.#kvStore,
      url: '<RELAY_URL>',
      websocket: typeof window !== 'undefined' ? WebSocket : undefined,
    })

    this.#sessionStore = await SessionStore.create(this.#kvStore);

    // init MWP Dapp Client
    this.#mwpDappClient = new DappClient({
      transport: this.#transport,
      sessionstore: this.#sessionStore,
      keymanager: this.#keyManager,
    })

    // Register handlers for the MWP Dapp Client
  }

  async createSession() {
    this.#assertDappClientInitialized(this.#mwpDappClient);
    // init Connection
    await this.#mwpDappClient.connect({
      initialPayload: this.#generateInitialPayload(),
      mode: "trusted",
    })

    // Get QR Code

    //
  }

  #generateInitialPayload(): QrSyncPayload {
    return {
      type: "init-sync-session",
    }
  }

  #assertDappClientInitialized(value: unknown): asserts value is DappClient {
    if (!value || !(value instanceof DappClient)) {
      throw new Error("MWP Dapp Client not initialized");
    }
  }
}
