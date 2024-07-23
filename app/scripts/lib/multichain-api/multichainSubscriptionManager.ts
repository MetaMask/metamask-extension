import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import { parseCaipChainId } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { Scope } from './scope';
import { JsonRpcMiddleware } from 'json-rpc-engine';

const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');

type MultichainSubscriptionManagerOptions = {
  findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];
  getNetworkClientById: NetworkControllerGetNetworkClientByIdAction['handler'];
};

export default class MultichainSubscriptionManager extends SafeEventEmitter {
  private subscriptionsByChain: {
    [scope: string]: {
      [domain: string]: unknown;
    };
  };

  private findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];

  private getNetworkClientById: NetworkControllerGetNetworkClientByIdAction['handler'];

  private subscriptionManagerByChain: { [scope: string]: any };
  private subscriptionsCountByScope: { [scope: string]: number };

  constructor(options: MultichainSubscriptionManagerOptions) {
    super();
    this.findNetworkClientIdByChainId = options.findNetworkClientIdByChainId;
    this.getNetworkClientById = options.getNetworkClientById;
    this.subscriptionManagerByChain = {};
    this.subscriptionsByChain = {};
    this.subscriptionsCountByScope = {};
  }

  onNotification(scope: Scope, domain: string, message: any) {
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
    this.subscriptionsCountByScope[scope]++;
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
    const subscriptionManager = this.subscriptionManagerByChain[scope];
    if (subscriptionManager && this.subscriptionsByChain[scope][domain]) {
      subscriptionManager.events.off(
        'notification',
        this.subscriptionsByChain[scope][domain],
      );
      delete this.subscriptionsByChain[scope][domain];
    }
    if (this.subscriptionsCountByScope[scope]) {
      this.subscriptionsCountByScope[scope]--;
      if (this.subscriptionsCountByScope[scope] === 0) {
        subscriptionManager.destroy();
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

// per scope middleware to handle legacy middleware
export const createMultichainMiddlewareManager = () => {
  const middlewaresByScope: Record<Scope, any> = {};
  const middlewareCountByDomainAndScope: Record<Scope, Record<string, number>> = {};
  const removeMiddleware = (scope: Scope, domain?: string) => {
    middlewareCountByDomainAndScope[scope] = middlewareCountByDomainAndScope[scope] || {};
    if (domain) {
      middlewareCountByDomainAndScope[scope][domain]--;
    }
    if (typeof domain === 'undefined' || middlewareCountByDomainAndScope[scope][domain] <= 0) {
      const middleware = middlewaresByScope[scope];
      if (domain) {
        delete middlewareCountByDomainAndScope[scope][domain];
      }
      middleware.destroy();
      delete middlewaresByScope[scope];
    }
  };

  const removeAllMiddlewareForDomain = (domain: string) => {
    for (const [scope, domains] of Object.entries(middlewareCountByDomainAndScope)) {
      for (const [_domain] of Object.entries(domains)) {
        if (_domain === domain) {
          removeMiddleware(scope, domain);
        }
      }
    }
  };

  const removeAllMiddleware = () => {
    for (const [scope, domainObject] of Object.entries(middlewareCountByDomainAndScope)) {
      for (const domain of Object.keys(domainObject)) {
        removeMiddleware(scope, domain);
      }
    }
  };

  const addMiddleware = (scope: Scope, domain: string, middleware: JsonRpcMiddleware<unknown, unknown>) => {
    middlewareCountByDomainAndScope[scope] = middlewareCountByDomainAndScope[scope] || {};
    middlewareCountByDomainAndScope[scope][domain] = middlewareCountByDomainAndScope[scope][domain] || 0;
    middlewareCountByDomainAndScope[scope][domain]++;
    if (!middlewaresByScope[scope]) {
      middlewaresByScope[scope] = middleware;
    }
  };

  return {
    middleware: (req: any, res: any, next: any, end: any) => {
      if (!middlewaresByScope[req.scope]) {
        return next();
      }
      return middlewaresByScope[req.scope](req, res, next, end);
    },
    addMiddleware,
    removeMiddleware,
    removeAllMiddleware,
    removeAllMiddlewareForDomain
  };
};
