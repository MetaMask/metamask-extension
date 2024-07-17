import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import { parseCaipChainId } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { Scope } from './scope';

const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');

type MultichainSubscriptionManagerOptions = {
  findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];
  getNetworkClientById: NetworkControllerGetNetworkClientByIdAction['handler'];
};

export default class MultichainSubscriptionManager extends SafeEventEmitter {
  private subscriptionsByChain: { [scope: string]: unknown };

  private findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];

  private getNetworkClientById: NetworkControllerGetNetworkClientByIdAction['handler'];

  private subscriptionManagerByChain: { [scope: string]: any };

  constructor(options: MultichainSubscriptionManagerOptions) {
    super();
    this.findNetworkClientIdByChainId = options.findNetworkClientIdByChainId;
    this.getNetworkClientById = options.getNetworkClientById;
    this.subscriptionManagerByChain = {};
    this.subscriptionsByChain = {};
  }

  onNotification(scope: Scope, message: any) {
    this.emit('notification', {
      method: 'wallet_invokeMethod',
      params: {
        scope,
        request: message,
      },
    });
  }

  subscribe(scope: Scope) {
    const networkClientId = this.findNetworkClientIdByChainId(
      toHex(parseCaipChainId(scope).reference),
    );
    const networkClient = this.getNetworkClientById(networkClientId);
    const subscriptionManager = createSubscriptionManager({
      blockTracker: networkClient.blockTracker,
      provider: networkClient.provider,
    });
    this.subscriptionManagerByChain[scope] = subscriptionManager;
    this.subscriptionsByChain[scope] = this.onNotification.bind(this, scope);
    subscriptionManager.events.on(
      'notification',
      this.subscriptionsByChain[scope],
    );
    return subscriptionManager;
  }

  unsubscribe(scope: Scope) {
    const subscriptionManager = this.subscriptionManagerByChain[scope];
    if (subscriptionManager) {
      subscriptionManager.events.off(
        'notification',
        this.subscriptionsByChain[scope],
      );
      subscriptionManager.destroy();
    }
    delete this.subscriptionManagerByChain[scope];
    delete this.subscriptionsByChain[scope];
  }

  unsubscribeAll() {
    Object.keys(this.subscriptionManagerByChain).forEach((scope) => {
      this.unsubscribe(scope);
    });
  }
}

// per scope middleware to handle legacy middleware
export const createMultichainMiddlewareManager = () => {
  const middlewaresByScope: Record<Scope, any> = {};
  const removeMiddleware = (scope: Scope) => {
    const middleware = middlewaresByScope[scope];
    middleware.destroy();
    delete middlewaresByScope[scope];
  };

  const removeAllMiddleware = () => {
    Object.keys(middlewaresByScope).forEach((scope) => {
      removeMiddleware(scope);
    });
  };

  const addMiddleware = (scope: Scope, middleware: any) => {
    middlewaresByScope[scope] = middleware;
  };

  return {
    middleware: (req: any, res: any, next: any, end: any) => {
      return middlewaresByScope[req.scope](req, res, next, end);
    },
    addMiddleware,
    removeMiddleware,
    removeAllMiddleware,
  };
};
