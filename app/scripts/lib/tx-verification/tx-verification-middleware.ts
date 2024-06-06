import { hashMessage } from '@ethersproject/hash';
import { verifyMessage } from '@ethersproject/wallet';
import type { NetworkController } from '@metamask/network-controller';
import { rpcErrors } from '@metamask/rpc-errors';
import { Json, JsonRpcParams, hasProperty, isObject } from '@metamask/utils';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from 'json-rpc-engine';
import {
  SIG_LEN,
  TRUSTED_BRIDGE_SIGNER,
} from '../../../../shared/constants/bridge';
import { FIRST_PARTY_CONTRACT_NAMES } from '../../../../shared/constants/first-party-contracts';

export type BridgeTxParams = {
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
 * @returns The middleware function.
 */
export function createTxVerificationMiddleware(
  networkController: NetworkController,
) {
  return function txVerificationMiddleware(
    req: JsonRpcRequest<JsonRpcParams>,
    _res: JsonRpcResponse<Json>,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ) {
    if (
      req.method !== 'eth_sendTransaction' ||
      !Array.isArray(req.params) ||
      !isValidParams(req.params)
    ) {
      return next();
    }

    // the tx object is the first element
    const params = req.params[0];

    const chainId =
      typeof params.chainId === 'string'
        ? (params.chainId.toLowerCase() as `0x${string}`)
        : networkController.state.providerConfig.chainId;

    // if the recipient address is not the bridge contract, skip verification
    if (
      params.to.toLowerCase() !==
      FIRST_PARTY_CONTRACT_NAMES['MetaMask Bridge'][chainId].toLowerCase()
    ) {
      return next();
    }

    const paramsToVerify = {
      to: hashMessage(params.to.toLowerCase()),
      from: hashMessage(params.from.toLowerCase()),
      data: hashMessage(
        params.data.toLowerCase().substring(0, params.data.length - SIG_LEN),
      ),
      value: hashMessage(params.value.toLowerCase()),
    };
    const h = hashMessage(JSON.stringify(paramsToVerify));

    // signature is 130 chars in length at the end
    const signature = `0x${params.data.substr(-SIG_LEN)}`;
    const addressToVerify = verifyMessage(h, signature);

    if (addressToVerify.toLowerCase() !== TRUSTED_BRIDGE_SIGNER.toLowerCase()) {
      return end(
        rpcErrors.invalidParams('Invalid bridge transaction signature.'),
      );
    }
    return next();
  };
}

/**
 * Checks if the params of a JSON-RPC request are valid `eth_sendTransaction`
 * params.
 *
 * @param params - The params to validate.
 * @returns Whether the params are valid.
 */
function isValidParams(params: Json[]): params is [BridgeTxParams] {
  return (
    isObject(params[0]) &&
    (!hasProperty(params[0], 'chainId') ||
      (typeof params[0].chainId === 'string' &&
        params[0].chainId.startsWith('0x'))) &&
    typeof params[0].data === 'string' &&
    typeof params[0].from === 'string' &&
    typeof params[0].to === 'string' &&
    typeof params[0].value === 'string'
  );
}
