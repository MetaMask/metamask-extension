// Request and responses are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { providerErrors } from '@metamask/rpc-errors';
import { JsonRpcRequest } from '@metamask/utils';
import { AppStateController } from '../controllers/app-state-controller';
import { BLOCKABLE_METHODS } from '../../../shared/constants/origin-throttling';

export type ExtendedJSONRPCRequest = JsonRpcRequest & { origin: string };

export const SPAM_FILTER_ACTIVATED_ERROR = providerErrors.unauthorized(
  'Request blocked due to spam filter.',
);

export function validateOriginThrottling({
  req,
  end,
  appStateController,
}: {
  req: ExtendedJSONRPCRequest;
  end: any;
  appStateController: AppStateController;
}): boolean {
  const isDappBlocked = appStateController.isOriginBlockedForConfirmations(
    req.origin,
  );

  if (isDappBlocked) {
    end(SPAM_FILTER_ACTIVATED_ERROR);
  }

  return isDappBlocked;
}

export default function createOriginThrottlingMiddleware({
  appStateController,
}: {
  appStateController: AppStateController;
}) {
  return function originThrottlingMiddleware(
    req: ExtendedJSONRPCRequest,
    _res: any,
    next: any,
    end: any,
  ) {
    const isBlockableRPCMethod = BLOCKABLE_METHODS.has(req.method);
    if (!isBlockableRPCMethod) {
      next();
      return;
    }

    const isDappBlocked = validateOriginThrottling({
      end,
      appStateController,
      req,
    });

    if (isDappBlocked) {
      return;
    }

    next();
  };
}
