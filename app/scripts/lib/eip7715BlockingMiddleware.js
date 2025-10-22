import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';

export default function createEip7715BlockingMiddleware(opts) {
  return function eip7715BlockingMiddleware(req, _, next) {
    const controller = opts.controller;
    const { origin } = req;
    if (controller._isEip7715RequestInProcess && !isSnapPreinstalled(origin)) {
      throw new Error(
        'Cannot process requests while a wallet_requestExecutionPermissions request is in process',
      );
    }
    next();
  };
}
