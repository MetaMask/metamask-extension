import EventEmitter from 'events';
import { NetworkController } from '@metamask/network-controller';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import { CaipChainId, Hex, parseCaipChainId } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';

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

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');

type MultichainSubscriptionManagerOptions = {
  findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];
  getNetworkClientById: NetworkController['getNetworkClientById'];
};

export default class MultichainSubscriptionManager extends SafeEventEmitter {
  private subscriptionsByChain: {
    [scope: string]: {
      [domain: string]: (message: SubscriptionNotificationEvent) => void;
    };
  };

  private findNetworkClientIdByChainId: NetworkController['findNetworkClientIdByChainId'];

  private getNetworkClientById: NetworkController['getNetworkClientById'];

  public subscriptionManagerByChain: { [scope: string]: SubscriptionManager };

  private subscriptionsCountByScope: { [scope: string]: number };

  constructor(options: MultichainSubscriptionManagerOptions) {
    super();
    this.findNetworkClientIdByChainId = options.findNetworkClientIdByChainId;
    this.getNetworkClientById = options.getNetworkClientById;
    this.subscriptionManagerByChain = {};
    this.subscriptionsByChain = {};
    this.subscriptionsCountByScope = {};
  }

  onNotification(
    scopeString: CaipChainId,
    domain: string,
    { method, params }: SubscriptionNotificationEvent,
  ) {
    this.emit('notification', domain, {
      method: 'wallet_notify',
      params: {
        scope: scopeString,
        notification: { method, params },
      },
    });
  }

  subscribe(scopeString: CaipChainId, domain: string) {
    let subscriptionManager;
    if (this.subscriptionManagerByChain[scopeString]) {
      subscriptionManager = this.subscriptionManagerByChain[scopeString];
    } else {
      const networkClientId = this.findNetworkClientIdByChainId(
        toHex(parseCaipChainId(scopeString).reference),
      );
      const networkClient = this.getNetworkClientById(networkClientId);
      subscriptionManager = createSubscriptionManager({
        blockTracker: networkClient.blockTracker,
        provider: networkClient.provider,
      });
      this.subscriptionManagerByChain[scopeString] = subscriptionManager;
    }
    this.subscriptionsByChain[scopeString] =
      this.subscriptionsByChain[scopeString] || {};
    this.subscriptionsByChain[scopeString][domain] = (
      message: SubscriptionNotificationEvent,
    ) => {
      this.onNotification(scopeString, domain, message);
    };
    subscriptionManager.events.on(
      'notification',
      this.subscriptionsByChain[scopeString][domain],
    );
    this.subscriptionsCountByScope[scopeString] ??= 0;
    this.subscriptionsCountByScope[scopeString] += 1;
    return subscriptionManager;
  }

  unsubscribe(scopeString: CaipChainId, domain: string) {
    const subscriptionManager: SubscriptionManager =
      this.subscriptionManagerByChain[scopeString];
    if (subscriptionManager && this.subscriptionsByChain[scopeString][domain]) {
      subscriptionManager.events.off(
        'notification',
        this.subscriptionsByChain[scopeString][domain],
      );
      delete this.subscriptionsByChain[scopeString][domain];
    }
    if (this.subscriptionsCountByScope[scopeString]) {
      this.subscriptionsCountByScope[scopeString] -= 1;
      if (this.subscriptionsCountByScope[scopeString] === 0) {
        // might be destroyed already
        if (subscriptionManager.destroy) {
          subscriptionManager.destroy();
        }
        delete this.subscriptionsCountByScope[scopeString];
        delete this.subscriptionManagerByChain[scopeString];
        delete this.subscriptionsByChain[scopeString];
      }
    }
  }

  unsubscribeAll() {
    Object.entries(this.subscriptionsByChain).forEach(
      ([scopeString, domainObject]) => {
        Object.entries(domainObject).forEach(([domain]) => {
          this.unsubscribe(scopeString as CaipChainId, domain);
        });
      },
    );
  }

  unsubscribeScope(scopeString: CaipChainId) {
    Object.entries(this.subscriptionsByChain).forEach(
      ([_scopeString, domainObject]) => {
        if (scopeString === _scopeString) {
          Object.entries(domainObject).forEach(([domain]) => {
            this.unsubscribe(scopeString, domain);
          });
        }
      },
    );
  }

  unsubscribeDomain(domain: string) {
    Object.entries(this.subscriptionsByChain).forEach(
      ([scopeString, domainObject]) => {
        Object.entries(domainObject).forEach(([_domain]) => {
          if (domain === _domain) {
            this.unsubscribe(scopeString as CaipChainId, domain);
          }
        });
      },
    );
  }
}
