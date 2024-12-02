import { hashMessage } from '@ethersproject/hash';
import { verifyMessage } from '@ethersproject/wallet';
import type { NetworkController } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcParams,
  JsonRpcResponse,
  Hex,
} from '@metamask/utils';
import { hasProperty, isObject, JsonRpcRequest } from '@metamask/utils';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import {
  EXPERIENCES_TO_VERIFY,
  getExperience,
  TX_SIG_LEN,
  TRUSTED_SIGNERS,
} from '../../../../shared/constants/verification';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';

export type TxParams = {
  chainId?: `0x${string}`;
  data: string;
  from: string;
  to: string;
  value: string;
};

/**
 * Creates a middleware function that verifies bridge transactions from the
 * Portfolio.
 *
 * @param networkController - The network controller instance.
 * @param trustedSigners
 * @returns The middleware function.
 */
export function createTxVerificationMiddleware(
  networkController: NetworkController,
  trustedSigners = TRUSTED_SIGNERS,
) {
  return function txVerificationMiddleware(
    req: JsonRpcRequest<JsonRpcParams>,
    _res: JsonRpcResponse<Json>,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ) {
    if (
      req.method !== MESSAGE_TYPE.ETH_SEND_TRANSACTION ||
      !Array.isArray(req.params) ||
      !isValidParams(req.params)
    ) {
      return next();
    }

    // the tx object is the first element
    const params = req.params[0];
    const chainId =
      typeof params.chainId === 'string'
        ? (params.chainId.toLowerCase() as Hex)
        : getCurrentChainId({ metamask: networkController.state });

    const experienceType = getExperience(
      params.to.toLowerCase() as Hex,
      chainId,
    );
    // if undefined then no address matched - skip OR if experience is not one we want to verify against - skip
    if (!experienceType || !EXPERIENCES_TO_VERIFY.includes(experienceType)) {
      return next();
    }

    const signature = `0x${params.data.slice(-TX_SIG_LEN)}`;
    const addressToVerify = verifyMessage(hashParams(params), signature);
    if (addressToVerify !== trustedSigners[experienceType]) {
      return end(rpcErrors.invalidParams('Invalid transaction signature.'));
    }
    return next();
  };
}

function hashParams(params: TxParams): string {
  const paramsToVerify = {
    to: hashMessage(params.to.toLowerCase()),
    from: hashMessage(params.from.toLowerCase()),
    data: hashMessage(
      params.data.toLowerCase().slice(0, params.data.length - TX_SIG_LEN),
    ),
    value: hashMessage(params.value.toLowerCase()),
  };
  return hashMessage(JSON.stringify(paramsToVerify));
}

/**
 * Checks if the params of a JSON-RPC request are valid `eth_sendTransaction`
 * params.
 *
 * @param params - The params to validate.
 * @returns Whether the params are valid.
 */
function isValidParams(params: Json[]): params is [TxParams] {
  return (
    isObject(params[0]) &&
    typeof params[0].data === 'string' &&
    typeof params[0].from === 'string' &&
    typeof params[0].to === 'string' &&
    typeof params[0].value === 'string' &&
    (!hasProperty(params[0], 'chainId') ||
      (typeof params[0].chainId === 'string' &&
        params[0].chainId.startsWith('0x')))
  );
}
