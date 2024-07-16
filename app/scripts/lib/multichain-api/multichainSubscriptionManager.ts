import { NetworkControllerFindNetworkClientIdByChainIdAction } from "@metamask/network-controller";
import SafeEventEmitter from "@metamask/safe-event-emitter";
import { parseCaipChainId } from "@metamask/utils";
import { Scope } from "./scope";
import { toHex } from "@metamask/controller-utils";

const createSubscriptionManager = require('@metamask/eth-json-rpc-filters/subscriptionManager');

type MultichainSubscriptionManagerOptions = {
  findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];
};

export default class MultichainSubscriptionManager extends SafeEventEmitter {
  private subscriptionsByChain: { [scope: string]: unknown };
  private findNetworkClientIdByChainId: NetworkControllerFindNetworkClientIdByChainIdAction['handler'];
  private subscriptionManagerByChain: { [scope: string]: any };
  constructor(options: MultichainSubscriptionManagerOptions) {
    super();
    this.findNetworkClientIdByChainId = options.findNetworkClientIdByChainId;
    this.subscriptionManagerByChain = {};
    this.subscriptionsByChain = {};
  }
  onNotification(scope: Scope, message: any) {
    this.emit('notification', {
      method: 'wallet_invokeMethod',
      params: {
        scope,
        request: message,
      }
    });
  }
  subscribe(scope: Scope) {
    const subscriptionManager = createSubscriptionManager(this.findNetworkClientIdByChainId(
      toHex(parseCaipChainId(scope).reference))
    );
    this.subscriptionManagerByChain[scope] = subscriptionManager;
    this.subscriptionsByChain[scope] = (message: any) =>
      this.emit('notification', {
        method: 'wallet_invokeMethod',
        params: {
          scope,
          request: message,
        }
      })
    subscriptionManager.events.on('notification', this.subscriptionsByChain[scope]);
    return subscriptionManager;
  }
  unsubscribe(scope: Scope) {
    const subscriptionManager = this.subscriptionManagerByChain[scope];
    subscriptionManager.events.off('notification', this.subscriptionsByChain[scope]);
    subscriptionManager.destroy()
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
  const removeMiddleware = (key: string) => {
    const middleware = middlewaresByScope[key];
    middleware.destroy();
    delete middlewaresByScope[key];
  }

  const removeAllMiddleware = () => {
    console.log('removing all middleware', middlewaresByScope);
    Object.keys(middlewaresByScope).forEach((key) => {
      removeMiddleware(key);
    });
  }

  const addMiddleware = (scope: Scope, middleware: any) => {
    middlewaresByScope[scope] = middleware;
  }

  return {
    middleware: async (req: any, res: any, next: any, end: any) => {
      middlewaresByScope[req.scope](req, res, next, end);
    },
    addMiddleware,
    removeMiddleware,
    removeAllMiddleware,
  }
}
