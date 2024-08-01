import { JsonRpcMiddleware } from 'json-rpc-engine';
import { Scope } from './scope';

// Extend JsonRpcMiddleware to include the destroy method
export type ExtendedJsonRpcMiddleware =
  | {
      destroy: () => void;
    }
  | JsonRpcMiddleware<unknown, unknown>;

type MiddlewareByScope = Record<
  Scope,
  ExtendedJsonRpcMiddleware | { destroy: () => void }
>;

type MiddlewareManager = {
  removeMiddleware: (scope: Scope, domain: string) => void;
  removeAllMiddleware: () => void;
  addMiddleware: (
    scope: Scope,
    domain: string,
    middleware: ExtendedJsonRpcMiddleware,
  ) => void;
  middleware: ExtendedJsonRpcMiddleware | { destroy: () => void };
  destroy: () => void;
};

export default function createMultichainMiddlewareManager(): MiddlewareManager {
  const middlewareCountByDomainAndScope: {
    [scope: string]: { [domain: string]: number };
  } = {};

  const middlewaresByScope: MiddlewareByScope = {};

  function removeAllMiddleware() {
    for (const [scope, domainObject] of Object.entries(
      middlewareCountByDomainAndScope,
    )) {
      for (const domain of Object.keys(domainObject)) {
        removeMiddleware(scope, domain);
      }
    }
  }

  function addMiddleware(
    scope: Scope,
    domain: string,
    middleware: ExtendedJsonRpcMiddleware,
  ) {
    middlewareCountByDomainAndScope[scope] =
      middlewareCountByDomainAndScope[scope] || {};
    middlewareCountByDomainAndScope[scope][domain] =
      middlewareCountByDomainAndScope[scope][domain] || 0;
    middlewareCountByDomainAndScope[scope][domain] += 1;
    if (!middlewaresByScope[scope]) {
      middlewaresByScope[scope] = middleware;
    }
  }

  function removeMiddleware(scope: Scope, domain: string) {
    if (middlewareCountByDomainAndScope[scope]?.[domain]) {
      middlewareCountByDomainAndScope[scope][domain] -= 1;
      if (middlewareCountByDomainAndScope[scope][domain] === 0) {
        delete middlewareCountByDomainAndScope[scope][domain];
      }
      if (Object.keys(middlewareCountByDomainAndScope[scope]).length === 0) {
        delete middlewareCountByDomainAndScope[scope];
        delete middlewaresByScope[scope];
      }
    }
  }

  const middleware: ExtendedJsonRpcMiddleware | { destroy: () => void } = (
    req,
    res,
    next,
    end,
  ) => {
    const r = req as unknown as { scope: string };
    const { scope } = r;
    if (typeof middlewaresByScope[scope] === 'function') {
      middlewaresByScope[scope](req, res, next, end);
    } else {
      next();
    }
  };

  function destroy() {
    removeAllMiddleware();
  }

  return {
    removeAllMiddleware,
    addMiddleware,
    removeMiddleware,
    middleware,
    destroy,
  };
}
