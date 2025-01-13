// Request and responses are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { providerErrors } from '@metamask/rpc-errors';
import { JsonRpcRequest } from '@metamask/utils';
import { OriginThrottlingController } from '../controllers/origin-throttling-controller';
import { BLOCKABLE_METHODS } from '../../../shared/constants/origin-throttling';

export type ExtendedJSONRPCRequest = JsonRpcRequest & { origin: string };

export const SPAM_FILTER_ACTIVATED_ERROR = providerErrors.unauthorized(
  'Request blocked due to spam filter.',
);

export function validateOriginThrottling({
  req,
  end,
  originThrottlingController,
}: {
  req: ExtendedJSONRPCRequest;
  end: any;
  originThrottlingController: OriginThrottlingController;
}): boolean {
  const isDappBlocked =
    originThrottlingController.isOriginBlockedForConfirmations(req.origin);

  if (isDappBlocked) {
    end(SPAM_FILTER_ACTIVATED_ERROR);
  }

  return isDappBlocked;
}

export default function createOriginThrottlingMiddleware({
  originThrottlingController,
}: {
  originThrottlingController: OriginThrottlingController;
}) {
  return async function originThrottlingMiddleware(
    req: ExtendedJSONRPCRequest,
    _res: any,
    next: any,
    end: any,
  ) {
    const isBlockableRPCMethod = BLOCKABLE_METHODS.has(req.method);
    if (!isBlockableRPCMethod) {
      return next();
    }

    const isDappBlocked = validateOriginThrottling({
      end,
      originThrottlingController,
      req,
    });

    if (!isDappBlocked) {
      return next();
    }

    return;
  };
}
