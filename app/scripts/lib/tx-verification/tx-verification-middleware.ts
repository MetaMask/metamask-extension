import { hashMessage } from '@ethersproject/hash';
import { verifyMessage } from '@ethersproject/wallet';
import type { NetworkController } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import {
  Json,
  JsonRpcParams,
  hasProperty,
  isObject,
  Hex,
} from '@metamask/utils';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from 'json-rpc-engine';
import {
  EXPERIENCES_TO_VERIFY,
  addrToExpMap,
  TX_SIG_LEN,
  TRUSTED_SIGNERS,
} from '../../../../shared/constants/verification';
import { EXPERIENCES_TYPE } from '../../../../shared/constants/first-party-contracts';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';

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
        : networkController.state.providerConfig.chainId;

    const r = addrToExpMap[params.to.toLowerCase()];
    // if undefined then no address matched
    if (!r) {
      return next();
    }
    const { experienceType, chainId: experienceChainId } = r;
    // skip if chainId is different
    if (experienceChainId !== chainId) {
      return next();
    }
    // skip if experience is not one we want to verify against
    if (!EXPERIENCES_TO_VERIFY.includes(experienceType as EXPERIENCES_TYPE)) {
      return next();
    }

    const signature = `0x${params.data.slice(-TX_SIG_LEN)}`;
    const addressToVerify = verifyMessage(hashedParams(params), signature);
    if (addressToVerify !== trustedSigners[experienceType]) {
      return end(rpcErrors.invalidParams('Invalid transaction signature.'));
    }
    return next();
  };
}

function hashedParams(params: TxParams): string {
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
