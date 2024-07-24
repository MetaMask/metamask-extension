import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import { parseCaipChainId } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { Scope } from './scope';

type SubscriptionManager = {
  events: {
    on: (
      event: string,
      listener: MultichainSubscriptionManager['onNotification'],
    ) => void;
    off: (
      event: string,
      listener: MultichainSubscriptionManager['onNotification'],
    ) => void;
  };
  destroy?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');

type MultichainSubscriptionManagerOptions = {
  findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];
  getNetworkClientById: NetworkControllerGetNetworkClientByIdAction['handler'];
};

export default class MultichainSubscriptionManager extends SafeEventEmitter {
  private subscriptionsByChain: {
    [scope: string]: {
      [domain: string]: MultichainSubscriptionManager['onNotification'];
    };
  };

  private findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];

  private getNetworkClientById: NetworkControllerGetNetworkClientByIdAction['handler'];

  private subscriptionManagerByChain: { [scope: string]: SubscriptionManager };

  private subscriptionsCountByScope: { [scope: string]: number };

  constructor(options: MultichainSubscriptionManagerOptions) {
    super();
    this.findNetworkClientIdByChainId = options.findNetworkClientIdByChainId;
    this.getNetworkClientById = options.getNetworkClientById;
    this.subscriptionManagerByChain = {};
    this.subscriptionsByChain = {};
    this.subscriptionsCountByScope = {};
  }

  onNotification(scope: Scope, domain: string, message: unknown) {
    this.emit('notification', domain, {
      method: 'wallet_invokeMethod',
      params: {
        scope,
        request: message,
      },
    });
  }

  subscribe(scope: Scope, domain: string) {
    this.subscriptionsCountByScope[scope] =
      this.subscriptionsCountByScope[scope] || 0;
    this.subscriptionsCountByScope[scope] += 1;
    let subscriptionManager;
    if (this.subscriptionManagerByChain[scope]) {
      subscriptionManager = this.subscriptionManagerByChain[scope];
    } else {
      const networkClientId = this.findNetworkClientIdByChainId(
        toHex(parseCaipChainId(scope).reference),
      );
      const networkClient = this.getNetworkClientById(networkClientId);
      subscriptionManager = createSubscriptionManager({
        blockTracker: networkClient.blockTracker,
        provider: networkClient.provider,
      });
      this.subscriptionManagerByChain[scope] = subscriptionManager;
    }
    this.subscriptionsByChain[scope] = this.subscriptionsByChain[scope] || {};
    this.subscriptionsByChain[scope][domain] = this.onNotification.bind(
      this,
      scope,
      domain,
    );
    subscriptionManager.events.on(
      'notification',
      this.subscriptionsByChain[scope][domain],
    );
    return subscriptionManager;
  }

  unsubscribe(scope: Scope, domain: string) {
    const subscriptionManager: SubscriptionManager = this.subscriptionManagerByChain[scope];
    if (subscriptionManager && this.subscriptionsByChain[scope][domain]) {
      subscriptionManager.events.off(
        'notification',
        this.subscriptionsByChain[scope][domain],
      );
      delete this.subscriptionsByChain[scope][domain];
    }
    if (this.subscriptionsCountByScope[scope]) {
      this.subscriptionsCountByScope[scope] -= 1;
      if (this.subscriptionsCountByScope[scope] === 0) {
        // might be destroyed already
        if (subscriptionManager.destroy) {
          subscriptionManager.destroy();
        }
        delete this.subscriptionsCountByScope[scope];
        delete this.subscriptionManagerByChain[scope];
        delete this.subscriptionsByChain[scope];
      }
    }
  }

  unsubscribeAll() {
    Object.entries(this.subscriptionsByChain).forEach(
      ([scope, domainObject]) => {
        Object.entries(domainObject).forEach(([domain]) => {
          this.unsubscribe(scope, domain);
        });
      },
    );
  }

  unsubscribeScope(scope: string) {
    Object.entries(this.subscriptionsByChain).forEach(
      ([_scope, domainObject]) => {
        if (scope === _scope) {
          Object.entries(domainObject).forEach(([_domain]) => {
            this.unsubscribe(_scope, _domain);
          });
        }
      },
    );
  }

  unsubscribeDomain(domain: string) {
    Object.entries(this.subscriptionsByChain).forEach(
      ([scope, domainObject]) => {
        Object.entries(domainObject).forEach(([_domain]) => {
          if (domain === _domain) {
            this.unsubscribe(scope, _domain);
          }
        });
      },
    );
  }
}
