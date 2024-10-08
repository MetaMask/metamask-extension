import { JsonRpcMiddleware } from 'json-rpc-engine';
import { ExternalScopeString } from './scope';

// Extend JsonRpcMiddleware to include the destroy method
// this was introduced in 7.0.0 of json-rpc-engine: https://github.com/MetaMask/json-rpc-engine/blob/v7.0.0/src/JsonRpcEngine.ts#L29-L40
export type ExtendedJsonRpcMiddleware = JsonRpcMiddleware<unknown, unknown> & {
  destroy?: () => void;
};

type MiddlewareKey = {
  scope: ExternalScopeString;
  origin: string;
  tabId?: number;
};
type MiddlewareEntry = MiddlewareKey & {
  middleware: ExtendedJsonRpcMiddleware;
};

export default class MultichainMiddlewareManager {
  #middlewares: MiddlewareEntry[] = [];

  #getMiddlewareEntry({
    scope,
    origin,
    tabId,
  }: MiddlewareKey): MiddlewareEntry | undefined {
    return this.#middlewares.find((middlewareEntry) => {
      return (
        middlewareEntry.scope === scope &&
        middlewareEntry.origin === origin &&
        middlewareEntry.tabId === tabId
      );
    });
  }

  #removeMiddlewareEntry({ scope, origin, tabId }: MiddlewareKey) {
    this.#middlewares = this.#middlewares.filter((middlewareEntry) => {
      return (
        middlewareEntry.scope !== scope ||
        middlewareEntry.origin !== origin ||
        middlewareEntry.tabId !== tabId
      );
    });
  }

  addMiddleware(middlewareEntry: MiddlewareEntry) {
    const { scope, origin, tabId } = middlewareEntry;
    if (!this.#getMiddlewareEntry({ scope, origin, tabId })) {
      this.#middlewares.push(middlewareEntry);
    }
  }

  removeMiddleware(middlewareKey: MiddlewareKey) {
    const existingMiddlewareEntry = this.#getMiddlewareEntry(middlewareKey);
    if (!existingMiddlewareEntry) {
      return;
    }

    existingMiddlewareEntry.middleware.destroy?.();

    this.#removeMiddlewareEntry(middlewareKey);
  }

  removeMiddlewareByScope(scope: ExternalScopeString) {
    this.#middlewares.forEach((middlewareEntry) => {
      if (middlewareEntry.scope === scope) {
        this.removeMiddleware(middlewareEntry);
      }
    });
  }

  removeMiddlewareByScopeAndOrigin(scope: ExternalScopeString, origin: string) {
    this.#middlewares.forEach((middlewareEntry) => {
      if (
        middlewareEntry.scope === scope &&
        middlewareEntry.origin === origin
      ) {
        this.removeMiddleware(middlewareEntry);
      }
    });
  }

  removeMiddlewareByOriginAndTabId(origin: string, tabId?: number) {
    this.#middlewares.forEach((middlewareEntry) => {
      if (
        middlewareEntry.origin === origin &&
        middlewareEntry.tabId === tabId
      ) {
        this.removeMiddleware(middlewareEntry);
      }
    });
  }

  generateMiddlewareForOriginAndTabId(origin: string, tabId?: number) {
    const middleware: ExtendedJsonRpcMiddleware = (req, res, next, end) => {
      const r = req as unknown as {
        scope: string;
      };
      const { scope } = r;
      const middlewareEntry = this.#getMiddlewareEntry({
        scope,
        origin,
        tabId,
      });

      if (middlewareEntry) {
        middlewareEntry.middleware(req, res, next, end);
      } else {
        next();
      }
    };
    middleware.destroy = this.removeMiddlewareByOriginAndTabId.bind(
      this,
      origin,
      tabId,
    );

    return middleware;
  }
}
