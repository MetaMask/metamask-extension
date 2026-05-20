import {
  createAsyncMiddleware,
  type AsyncJsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import log from 'loglevel';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../shared/constants/defi-referrals';
import type { ExtendedJSONRPCRequest } from './createDefiReferralMiddleware';

export const HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE =
  'HyperliquidTransaction:ApproveAgent';
export const HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME =
  'HyperliquidSignTransaction';

const HYPERLIQUID_ORIGIN =
  DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid].origin;
const TYPED_DATA_PARAM_INDEX = 1;

type RecordLike = Record<string, unknown>;

export type HyperliquidDepositSignatureTriggerContext = {
  origin: string;
  signerAddress?: string;
  tabId: number;
  typedData: RecordLike;
};

export type HyperliquidDepositPromptFlow = {
  id: string;
};

type CreateHyperliquidDepositSignatureTriggerMiddlewareOptions = {
  endDepositPromptFlow?: (
    flow: HyperliquidDepositPromptFlow,
  ) => Promise<void> | void;
  isEligible?: (
    context: HyperliquidDepositSignatureTriggerContext,
  ) => boolean | Promise<boolean>;
  openDepositFlow: (
    context: HyperliquidDepositSignatureTriggerContext,
  ) => void | Promise<void>;
  startDepositPromptFlow?: (
    context: HyperliquidDepositSignatureTriggerContext,
  ) => HyperliquidDepositPromptFlow | undefined;
};

export function createHyperliquidDepositSignatureTriggerMiddleware({
  endDepositPromptFlow,
  isEligible = () => true,
  openDepositFlow,
  startDepositPromptFlow,
}: CreateHyperliquidDepositSignatureTriggerMiddlewareOptions) {
  return createAsyncMiddleware(
    async (
      req: JsonRpcRequest,
      res: PendingJsonRpcResponse<Json>,
      next: AsyncJsonRpcEngineNextCallback,
    ) => {
      const context = getHyperliquidApproveAgentContext(req);
      const eligibilityPromise = context
        ? Promise.resolve(isEligible(context)).catch((error) => {
            log.error(
              'Failed to check Hyperliquid deposit prompt eligibility',
              error,
            );
            return false;
          })
        : undefined;
      const promptFlow = context
        ? startHyperliquidDepositPromptFlow({
            context,
            startDepositPromptFlow,
          })
        : undefined;

      try {
        await next();

        if (!context || typeof res.result !== 'string') {
          return;
        }

        if (!(await eligibilityPromise)) {
          return;
        }

        try {
          await Promise.resolve(openDepositFlow(context));
        } catch (error) {
          log.error(
            'Failed to open Hyperliquid deposit prompt after ApproveAgent signature',
            error,
          );
        }
      } finally {
        if (promptFlow && endDepositPromptFlow) {
          try {
            await Promise.resolve(endDepositPromptFlow(promptFlow));
          } catch (error) {
            log.error(
              'Failed to end Hyperliquid deposit prompt approval flow',
              error,
            );
          }
        }
      }
    },
  );
}

function startHyperliquidDepositPromptFlow({
  context,
  startDepositPromptFlow,
}: {
  context: HyperliquidDepositSignatureTriggerContext;
  startDepositPromptFlow?:
    | CreateHyperliquidDepositSignatureTriggerMiddlewareOptions['startDepositPromptFlow']
    | undefined;
}): HyperliquidDepositPromptFlow | undefined {
  try {
    return startDepositPromptFlow?.(context);
  } catch (error) {
    log.error(
      'Failed to start Hyperliquid deposit prompt approval flow',
      error,
    );
    return undefined;
  }
}

function getHyperliquidApproveAgentContext(
  req: JsonRpcRequest,
): HyperliquidDepositSignatureTriggerContext | undefined {
  if (
    !isExtendedJSONRPCRequest(req) ||
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
    tabId: req.tabId,
    typedData,
  };
}

function isExtendedJSONRPCRequest(
  req: JsonRpcRequest,
): req is ExtendedJSONRPCRequest {
  return (
    typeof (req as Partial<ExtendedJSONRPCRequest>).origin === 'string' &&
    typeof (req as Partial<ExtendedJSONRPCRequest>).tabId === 'number'
  );
}

function getSignerAddressFromRequest(req: JsonRpcRequest): string | undefined {
  const params = Array.isArray(req.params) ? req.params : [];
  const signerAddress = params[0];

  return typeof signerAddress === 'string' ? signerAddress : undefined;
}

function getTypedDataFromRequest(
  req: JsonRpcRequest,
): RecordLike | undefined {
  const params = Array.isArray(req.params) ? req.params : [];
  const typedDataParam = params[TYPED_DATA_PARAM_INDEX];

  if (isRecordLike(typedDataParam)) {
    return typedDataParam;
  }

  if (typeof typedDataParam !== 'string') {
    return undefined;
  }

  try {
    const parsedTypedData = JSON.parse(typedDataParam) as unknown;
    return isRecordLike(parsedTypedData) ? parsedTypedData : undefined;
  } catch {
    return undefined;
  }
}

function isHyperliquidApproveAgentTypedData(
  typedData: RecordLike | undefined,
): typedData is RecordLike {
  if (!typedData) {
    return false;
  }

  const {domain} = typedData;
  const {message} = typedData;

  return (
    typedData.primaryType === HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE &&
    isRecordLike(domain) &&
    domain.name === HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME &&
    isRecordLike(message) &&
    typeof message.hyperliquidChain === 'string' &&
    typeof message.agentAddress === 'string' &&
    message.nonce !== undefined
  );
}

function isRecordLike(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
