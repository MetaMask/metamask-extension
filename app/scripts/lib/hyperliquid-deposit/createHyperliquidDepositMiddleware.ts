import {
  createAsyncMiddleware,
  type AsyncJsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import {
  isPlainObject,
  type Json,
  type JsonRpcRequest,
  type PendingJsonRpcResponse,
} from '@metamask/utils';
import log from 'loglevel';
import { HYPERLIQUID_ORIGIN } from '../../../../shared/constants/defi-referrals';
import { isOriginAwareJsonRpcRequest } from '../rpc-request-utils';
import {
  HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE,
  HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME,
  ZERO_ADDRESS,
} from './constants';

const TYPED_DATA_PARAM_INDEX = 1;

export type HyperliquidDepositContext = {
  origin: string;
  signerAddress?: string;
  typedData: Record<string, unknown>;
};

type CreateHyperliquidDepositMiddlewareOptions = {
  isEligible?: (
    context: HyperliquidDepositContext,
  ) => boolean | Promise<boolean>;
  showDepositPrompt: (
    context: HyperliquidDepositContext,
  ) => void | Promise<void>;
};

/**
 * Middleware that triggers the Hyperliquid deposit prompt after a successful
 * "Enable trading" (`ApproveAgent`) signature from app.hyperliquid.xyz.
 *
 * Eligibility runs in parallel with the signature confirmation. Only eligible
 * users see the prompt; ineligible users see nothing extra.
 *
 * @param options - The middleware options.
 * @param options.isEligible - Determines whether the deposit prompt should be shown.
 * @param options.showDepositPrompt - Shows the deposit prompt approval.
 * @returns Async JSON-RPC middleware.
 */
export function createHyperliquidDepositMiddleware({
  isEligible = () => true,
  showDepositPrompt,
}: CreateHyperliquidDepositMiddlewareOptions) {
  return createAsyncMiddleware(
    async (
      req: JsonRpcRequest,
      res: PendingJsonRpcResponse<Json>,
      next: AsyncJsonRpcEngineNextCallback,
    ) => {
      const context = getHyperliquidApproveAgentContext(req);

      let eligibilityPromise: Promise<boolean> | undefined;

      if (context) {
        try {
          eligibilityPromise = Promise.resolve(isEligible(context)).catch(
            (error) => {
              log.error(
                'HyperliquidDepositPrompt: Eligibility check failed',
                error,
              );
              return false;
            },
          );
        } catch (error) {
          log.error(
            'HyperliquidDepositPrompt: Eligibility check failed',
            error,
          );
          eligibilityPromise = Promise.resolve(false);
        }
      }

      await next();

      if (!context || typeof res.result !== 'string') {
        return;
      }

      // Fire-and-forget: don't block the RPC response to Hyperliquid while
      // checking eligibility or showing the prompt.
      eligibilityPromise
        ?.then((eligible) =>
          eligible ? showDepositPrompt(context) : undefined,
        )
        .catch((error) => {
          log.error('HyperliquidDepositPrompt: Failed to show prompt', error);
        });
    },
  );
}

function getHyperliquidApproveAgentContext(
  req: JsonRpcRequest,
): HyperliquidDepositContext | undefined {
  if (
    !isOriginAwareJsonRpcRequest(req) ||
    req.origin !== HYPERLIQUID_ORIGIN ||
    req.method !== 'eth_signTypedData_v4'
  ) {
    return undefined;
  }

  const typedData = getTypedDataFromRequest(req);

  if (!isHyperliquidApproveAgentTypedData(typedData)) {
    return undefined;
  }

  return {
    origin: req.origin,
    signerAddress: getSignerAddressFromRequest(req),
    typedData,
  };
}

function getSignerAddressFromRequest(req: JsonRpcRequest): string | undefined {
  const params = Array.isArray(req.params) ? req.params : [];
  const signerAddress = params[0];

  return typeof signerAddress === 'string' ? signerAddress : undefined;
}

function getTypedDataFromRequest(
  req: JsonRpcRequest,
): Record<string, unknown> | undefined {
  const params = Array.isArray(req.params) ? req.params : [];
  const typedDataParam = params[TYPED_DATA_PARAM_INDEX];

  if (isPlainObject(typedDataParam)) {
    return typedDataParam;
  }

  if (typeof typedDataParam !== 'string') {
    return undefined;
  }

  try {
    const parsedTypedData = JSON.parse(typedDataParam) as unknown;
    return isPlainObject(parsedTypedData) ? parsedTypedData : undefined;
  } catch {
    return undefined;
  }
}

function isHyperliquidApproveAgentTypedData(
  typedData: Record<string, unknown> | undefined,
): typedData is Record<string, unknown> {
  if (!typedData) {
    return false;
  }

  const { domain, message } = typedData;

  return (
    typedData.primaryType === HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE &&
    isPlainObject(domain) &&
    domain.name === HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME &&
    isPlainObject(message) &&
    typeof message.hyperliquidChain === 'string' &&
    isNonZeroAgentAddress(message.agentAddress) &&
    message.nonce !== undefined
  );
}

/**
 * Zero address = API key revocation; non-zero = "Enable trading" request.
 * @param agentAddress
 */
function isNonZeroAgentAddress(agentAddress: unknown): boolean {
  return (
    typeof agentAddress === 'string' &&
    agentAddress.toLowerCase() !== ZERO_ADDRESS
  );
}
