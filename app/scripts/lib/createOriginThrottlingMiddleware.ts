import { providerErrors, errorCodes } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcError,
  JsonRpcResponse,
  JsonRpcRequest,
} from '@metamask/utils';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import type { ThrottledOrigin } from '../../../shared/types/origin-throttling';

export const NUMBER_OF_REJECTIONS_THRESHOLD = 3;
export const REJECTION_THRESHOLD_IN_MS = 30000;
export const BLOCKING_THRESHOLD_IN_MS = 60000;

export const BLOCKABLE_METHODS: Set<string> = new Set([
  MESSAGE_TYPE.ADD_ETHEREUM_CHAIN,
  MESSAGE_TYPE.ETH_SEND_TRANSACTION,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
  MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
  MESSAGE_TYPE.PERSONAL_SIGN,
  MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN,
  MESSAGE_TYPE.WALLET_SEND_CALLS,
  MESSAGE_TYPE.WATCH_ASSET,
]);

const TEST_ORIGINS = [
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
];

export type ExtendedJSONRPCRequest = JsonRpcRequest & { origin: string };

export const SPAM_FILTER_ACTIVATED_ERROR = providerErrors.unauthorized(
  'Request blocked due to spam filter.',
);

type CreateOriginThrottlingMiddlewareOptions = {
  getThrottledOriginState: (origin: string) => ThrottledOrigin | undefined;
  updateThrottledOriginState: (
    origin: string,
    throttledOriginState: ThrottledOrigin,
  ) => void;
};

const isUserRejectedError = (error: JsonRpcError) =>
  error.code === errorCodes.provider.userRejectedRequest;

export default function createOriginThrottlingMiddleware({
  getThrottledOriginState,
  updateThrottledOriginState,
}: CreateOriginThrottlingMiddlewareOptions) {
  return function originThrottlingMiddleware(
    req: ExtendedJSONRPCRequest,
    res: JsonRpcResponse<Json | JsonRpcError>,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ) {
    const { method, origin } = req;
    const isBlockableRPCMethod = BLOCKABLE_METHODS.has(method);

    // We don't want to throttle requests in e2e tests
    if (!isBlockableRPCMethod || TEST_ORIGINS.includes(origin)) {
      next();
      return;
    }

    const currentOriginState = getThrottledOriginState(origin);
    const isDappBlocked = isOriginBlockedForConfirmations(currentOriginState);

    if (isDappBlocked) {
      end(SPAM_FILTER_ACTIVATED_ERROR);
      return;
    }

    next((callback: () => void) => {
      if ('error' in res && res.error && isUserRejectedError(res.error)) {
        const extraData = res.error?.data as { cause?: string };
        // Any rejection caused by rejectAllApprovals is not evaluated as user rejection for now
        if (extraData?.cause === 'rejectAllApprovals') {
          callback();
          return;
        }

        // User rejected the request
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const throttledOriginState = getThrottledOriginState(origin) || {
          rejections: 0,
          lastRejection: 0,
        };

        const currentTime = Date.now();
        const isUnderThreshold =
          currentTime - throttledOriginState.lastRejection <
          REJECTION_THRESHOLD_IN_MS;
        const newRejections = isUnderThreshold
          ? throttledOriginState.rejections + 1
          : 1;

        updateThrottledOriginState(origin, {
          rejections: newRejections,
          lastRejection: currentTime,
        });
      } else {
        // User accepted the request
        const throttledOriginState = getThrottledOriginState(origin);
        const hasOriginThrottled = Boolean(throttledOriginState);
        if (hasOriginThrottled) {
          updateThrottledOriginState(origin, {
            rejections: 0,
            lastRejection: 0,
          });
        }
      }

      callback();
    });
  };
}

function isOriginBlockedForConfirmations(
  throttledOriginState: ThrottledOrigin | undefined,
) {
  if (!throttledOriginState) {
    return false;
  }
  const currentTime = Date.now();
  const { rejections, lastRejection } = throttledOriginState;
  const isWithinOneMinute =
    currentTime - lastRejection <= BLOCKING_THRESHOLD_IN_MS;

  return rejections >= NUMBER_OF_REJECTIONS_THRESHOLD && isWithinOneMinute;
}
