import EventEmitter from 'events';
import { NetworkController } from '@metamask/network-controller';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import { Hex, parseCaipChainId } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { ExternalScopeString, ScopeString } from './scope';

export type SubscriptionManager = {
  events: EventEmitter;
  destroy?: () => void;
};

type SubscriptionNotificationEvent = {
  jsonrpc: '2.0';
  method: 'eth_subscription';
  params: {
    subscription: Hex;
    result: unknown;
  };
};

type SubscriptionKey = {
  scope: ExternalScopeString;
  origin: string;
  tabId?: string;
};
type SubscriptionEntry = SubscriptionKey & {
  subscriptionManager: SubscriptionManager;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');

type MultichainSubscriptionManagerOptions = {
  findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
  getNetworkClientById: NetworkController['getNetworkClientById'];
};

export default class MultichainSubscriptionManager extends SafeEventEmitter {
  // private subscriptionsByChain: {
  //   [scope: string]: {
  //     [domain: string]: (message: SubscriptionNotificationEvent) => void;
  //   };
  // };

  #findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];

  #getNetworkClientById: NetworkController['getNetworkClientById'];

  #subscriptions: SubscriptionEntry[] = [];

  constructor(options: MultichainSubscriptionManagerOptions) {
    super();
    this.#findNetworkClientIdByChainId = options.findNetworkClientIdByChainId;
    this.#getNetworkClientById = options.getNetworkClientById;
  }

  onNotification(
    { scope, origin, tabId }: SubscriptionKey,
    { method, params }: SubscriptionNotificationEvent,
  ) {
    this.emit('notification', origin, tabId, {
      method: 'wallet_notify',
      params: {
        scope,
        notification: { method, params },
      },
    });
  }

  #getSubscriptionEntry({
    scope,
    origin,
    tabId,
  }: SubscriptionKey): SubscriptionEntry | undefined {
    return this.#subscriptions.find((subscriptionEntry) => {
      return (
        subscriptionEntry.scope === scope &&
        subscriptionEntry.origin === origin &&
        subscriptionEntry.tabId === tabId
      );
    });
  }

  subscribe(subscriptionKey: SubscriptionKey) {
    const subscriptionEntry = this.#getSubscriptionEntry(subscriptionKey);
    if (subscriptionEntry) {
      return subscriptionEntry.subscriptionManager;
    }

    const networkClientId = this.#findNetworkClientIdByChainId(
      toHex(parseCaipChainId(subscriptionKey.scope).reference),
    );
    const networkClient = this.#getNetworkClientById(networkClientId);
    const subscriptionManager = createSubscriptionManager({
      blockTracker: networkClient.blockTracker,
      provider: networkClient.provider,
    });

    subscriptionManager.events.on(
      'notification',
      (message: SubscriptionNotificationEvent) => {
        this.onNotification(subscriptionKey, message);
      },
    );

    this.#subscriptions.push({
      ...subscriptionKey,
      subscriptionManager,
    });

    return subscriptionManager;
  }

  unsubscribe(subscriptionKey: SubscriptionKey) {
    const existingSubscriptionEntry =
      this.#getSubscriptionEntry(subscriptionKey);
    if (!existingSubscriptionEntry) {
      return;
    }

    const { scope, origin, tabId, subscriptionManager } =
      existingSubscriptionEntry;

    subscriptionManager.destroy?.();

    this.#subscriptions = this.#subscriptions.filter((subscriptionEntry) => {
      return (
        subscriptionEntry.scope !== scope ||
        subscriptionEntry.origin !== origin ||
        subscriptionEntry.tabId !== tabId
      );
    });
  }

  unsubscribeAll() {
    this.#subscriptions.forEach((subscriptionEntry) => {
      this.unsubscribe(subscriptionEntry);
    });
  }

  unsubscribeByScope(scope: ScopeString) {
    this.#subscriptions.forEach((subscriptionEntry) => {
      if (subscriptionEntry.scope === scope) {
        this.unsubscribe(subscriptionEntry);
      }
    });
  }

  unsubscribeByOrigin(origin: string) {
    this.#subscriptions.forEach((subscriptionEntry) => {
      if (subscriptionEntry.origin === origin) {
        this.unsubscribe(subscriptionEntry);
      }
    });
  }

  unsubscribeByScopeAndOrigin(scope: ScopeString, origin: string) {
    this.#subscriptions.forEach((subscriptionEntry) => {
      if (
        subscriptionEntry.scope === scope &&
        subscriptionEntry.origin === origin
      ) {
        this.unsubscribe(subscriptionEntry);
      }
    });
  }

  unsubscribeByOriginAndTabId(origin: string, tabId?: string) {
    this.#subscriptions.forEach((subscriptionEntry) => {
      if (
        subscriptionEntry.origin === origin &&
        subscriptionEntry.tabId === tabId
      ) {
        this.unsubscribe(subscriptionEntry);
      }
    });
  }
}
