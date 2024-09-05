import { JsonRpcMiddleware } from 'json-rpc-engine';
import { ExternalScopeString } from './scope';

// Extend JsonRpcMiddleware to include the destroy method
// this was introduced in 7.0.0 of json-rpc-engine: https://github.com/MetaMask/json-rpc-engine/blob/v7.0.0/src/JsonRpcEngine.ts#L29-L40
export type ExtendedJsonRpcMiddleware = JsonRpcMiddleware<unknown, unknown> & {
  destroy?: () => void;
};

type MiddlewareByScope = Record<ExternalScopeString, ExtendedJsonRpcMiddleware>;

export default class MultichainMiddlewareManager {
  constructor() {
    this.middleware.destroy = this.removeAllMiddleware.bind(this);
  }

  private middlewareCountByDomainAndScope: {
    [scope: string]: { [domain: string]: number };
  } = {};

  private middlewaresByScope: MiddlewareByScope = {};

  public removeAllMiddleware() {
    for (const [scope, domainObject] of Object.entries(
      this.middlewareCountByDomainAndScope,
    )) {
      for (const domain of Object.keys(domainObject)) {
        this.removeMiddleware(scope, domain);
      }
    }
  }

  public addMiddleware(
    scopeString: ExternalScopeString,
    domain: string,
    middleware: ExtendedJsonRpcMiddleware,
  ) {
    this.middlewareCountByDomainAndScope[scopeString] =
      this.middlewareCountByDomainAndScope[scopeString] || {};
    this.middlewareCountByDomainAndScope[scopeString][domain] =
      this.middlewareCountByDomainAndScope[scopeString][domain] || 0;
    this.middlewareCountByDomainAndScope[scopeString][domain] += 1;
    if (!this.middlewaresByScope[scopeString]) {
      this.middlewaresByScope[scopeString] = middleware;
    }
  }

  public removeMiddleware(scopeString: ExternalScopeString, domain: string) {
    if (this.middlewareCountByDomainAndScope[scopeString]?.[domain]) {
      this.middlewareCountByDomainAndScope[scopeString][domain] -= 1;
      if (this.middlewareCountByDomainAndScope[scopeString][domain] === 0) {
        delete this.middlewareCountByDomainAndScope[scopeString][domain];
      }
      if (
        Object.keys(this.middlewareCountByDomainAndScope[scopeString])
          .length === 0
      ) {
        delete this.middlewareCountByDomainAndScope[scopeString];
        delete this.middlewaresByScope[scopeString];
      }
    }
  }

  public middleware: ExtendedJsonRpcMiddleware = (req, res, next, end) => {
    const r = req as unknown as { scope: string };
    const { scope } = r;
    if (typeof this.middlewaresByScope[scope] === 'function') {
      this.middlewaresByScope[scope](req, res, next, end);
    } else {
      next();
    }
  };
}
