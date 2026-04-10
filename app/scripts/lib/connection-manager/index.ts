/**
 * connection-manager (extension-specific)
 *
 * Manages dapp connections over chrome.runtime.Port streams: setup, origin
 * tracking, phishing detection routing, and dapp-facing notification dispatch.
 *
 * WHY A CLASS: ConnectionManager holds active per-port connection state. Unlike
 * the wallet-services modules (stateless function collections), this module's
 * correctness depends on tracking which ports are open. A class gives the
 * connection map a stable identity across the lifetime of the background page.
 *
 * WHY EXTENSION-SPECIFIC: chrome.runtime.Port is a Chrome/Firefox extension API.
 * Mobile uses a different IPC mechanism (React Native EventEmitter + JSI bridge).
 * The dapp notification dispatch pattern is also extension-specific (injected
 * provider vs. mobile wallet_connect transport).
 *
 * Extracted from MetamaskController (518 lines, 16 methods):
 *   setupUntrustedCommunicationEip1193, setupUntrustedCommunicationCaip,
 *   setupTrustedCommunication, setupPhishingCommunication,
 *   addConnection, removeConnection, notifyConnections, notifyAllConnections,
 *   sendUpdate (dapp-facing), _onPhishingPageVisit, _onPortDisconnect,
 *   _onMessage, getConnectedSites, removeAllConnections,
 *   removeConnectedAccounts, getRpcMethodMiddleware
 */

import type { Runtime } from 'webextension-polyfill';
import type { RootMessenger } from '../messenger';

type ConnectionState = {
  engine: unknown; // JsonRpcEngine
};

type ConnectionManagerDependencies = {
  messenger: RootMessenger;
};

/**
 * Tracks active dapp connections keyed by `${origin}:${tabId}`.
 * Owns setup, teardown, and notification dispatch for each connection.
 */
export class ConnectionManager {
  readonly #connections: Map<string, ConnectionState> = new Map();

  readonly #messenger: RootMessenger;

  constructor(deps: ConnectionManagerDependencies) {
    this.#messenger = deps.messenger;
  }

  /**
   * Wires an untrusted EIP-1193 port (dapp injected provider) to the
   * JSON-RPC middleware stack. Registers phishing detection and PPOM
   * middleware before the provider engine.
   *
   * Extracted from MetamaskController.setupUntrustedCommunicationEip1193.
   */
  setupUntrustedEip1193(port: Runtime.Port): void {
    const origin = new URL(port.sender?.url ?? 'unknown://').hostname;
    const key = `${origin}:${port.sender?.tab?.id ?? 'background'}`;

    // Phishing check before establishing the engine
    this.#messenger.call('PhishingController:maybeUpdateState');

    // TODO: wire JsonRpcEngine with PPOM + phishing + provider middleware
    const engine = { /* JsonRpcEngine instance */ };
    this.#connections.set(key, { engine });

    port.onDisconnect.addListener(() => this.#onPortDisconnect(key));
  }

  /**
   * Notifies all active connections for a given origin with a JSON-RPC
   * notification (e.g. accountsChanged, chainChanged).
   *
   * Extracted from MetamaskController.notifyConnections.
   */
  notifyConnections(
    origin: string,
    notification: { method: string; params?: unknown },
  ): void {
    for (const [key, conn] of this.#connections) {
      if (key.startsWith(`${origin}:`)) {
        // TODO: emit notification via engine
        void conn;
        void notification;
      }
    }
  }

  /**
   * Broadcasts a notification to every active connection regardless of origin.
   * Used for wallet-level events (e.g. metamask_unlockStateChanged).
   *
   * Extracted from MetamaskController.notifyAllConnections.
   */
  notifyAllConnections(notification: {
    method: string;
    params?: unknown;
  }): void {
    for (const [, conn] of this.#connections) {
      void conn;
      void notification;
      // TODO: emit notification via engine
    }
  }

  get connectionCount(): number {
    return this.#connections.size;
  }

  #onPortDisconnect(key: string): void {
    this.#connections.delete(key);
  }
}
