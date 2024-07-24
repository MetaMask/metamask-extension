import { JsonRpcMiddleware } from 'json-rpc-engine';
import { Scope } from './scope';

// per scope middleware to handle legacy middleware
export default class MultichainMiddlewareManager {
  private middlewaresByScope: Record<Scope, any> = {};

  private middlewareCountByDomainAndScope: Record<
    Scope,
    Record<string, number>
  > = {};

  removeMiddleware(scope: Scope, domain?: string) {
    this.middlewareCountByDomainAndScope[scope] =
      this.middlewareCountByDomainAndScope[scope] || {};
    if (domain) {
      this.middlewareCountByDomainAndScope[scope][domain] -= 1;
    }
    if (
      typeof domain === 'undefined' ||
      this.middlewareCountByDomainAndScope[scope][domain] <= 0
    ) {
      const middleware = this.middlewaresByScope[scope];
      if (domain) {
        delete this.middlewareCountByDomainAndScope[scope][domain];
      }
      middleware.destroy();
      delete this.middlewaresByScope[scope];
    }
  }

  removeAllMiddlewareForDomain(domain: string) {
    for (const [scope, domains] of Object.entries(
      this.middlewareCountByDomainAndScope,
    )) {
      for (const [_domain] of Object.entries(domains)) {
        if (_domain === domain) {
          this.removeMiddleware(scope, domain);
        }
      }
    }
  }

  removeAllMiddleware() {
    for (const [scope, domainObject] of Object.entries(
      this.middlewareCountByDomainAndScope,
    )) {
      for (const domain of Object.keys(domainObject)) {
        this.removeMiddleware(scope, domain);
      }
    }
  }

  addMiddleware(
    scope: Scope,
    domain: string,
    middleware: JsonRpcMiddleware<unknown, unknown>,
  ) {
    this.middlewareCountByDomainAndScope[scope] =
      this.middlewareCountByDomainAndScope[scope] || {};
    this.middlewareCountByDomainAndScope[scope][domain] =
      this.middlewareCountByDomainAndScope[scope][domain] || 0;
    this.middlewareCountByDomainAndScope[scope][domain] += 1;
    if (!this.middlewaresByScope[scope]) {
      this.middlewaresByScope[scope] = middleware;
    }
  }

  middleware: JsonRpcMiddleware<unknown, unknown> = (req, res, next, end) => {
    const r = req as unknown as { scope: string };
    if (!this.middlewaresByScope[r.scope]) {
      return next();
    }
    return this.middlewaresByScope[r.scope](req, res, next, end);
  };
}
